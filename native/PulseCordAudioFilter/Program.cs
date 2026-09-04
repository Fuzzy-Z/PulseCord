using System;
using System.IO;
using System.IO.Pipes;
using System.Runtime.InteropServices;
using System.Threading;

namespace PulseCord.AudioFilter
{
    class Program
    {
        private static bool _isRunning = true;

        [MTAThread]
        static void Main(string[] args)
        {
            NativeMethods.CoInitializeEx(IntPtr.Zero, NativeMethods.COINIT_MULTITHREADED);
            Console.OutputEncoding = System.Text.Encoding.UTF8;
            Console.WriteLine("[PulseCord Audio Filter] Starting WASAPI Audio Engine...");

            uint targetPid = 0;
            PROCESS_LOOPBACK_MODE loopbackMode = PROCESS_LOOPBACK_MODE.PROCESS_LOOPBACK_MODE_EXCLUDE_PROCESS_TREE;
            string pipeName = "pulsecord-clean-audio";

            for (int i = 0; i < args.Length; i++)
            {
                if (args[i] == "--exclude-pid" && i + 1 < args.Length)
                {
                    uint.TryParse(args[i + 1], out targetPid);
                    loopbackMode = PROCESS_LOOPBACK_MODE.PROCESS_LOOPBACK_MODE_EXCLUDE_PROCESS_TREE;
                }
                else if (args[i] == "--include-pid" && i + 1 < args.Length)
                {
                    uint.TryParse(args[i + 1], out targetPid);
                    loopbackMode = PROCESS_LOOPBACK_MODE.PROCESS_LOOPBACK_MODE_INCLUDE_PROCESS_TREE;
                }
                else if (args[i] == "--pipe" && i + 1 < args.Length)
                {
                    pipeName = args[i + 1];
                }
            }

            Console.WriteLine(string.Format("[PulseCord Audio Filter] Mode: {0}, Target PID: {1}, Pipe: {2}", loopbackMode, targetPid, pipeName));

            Console.CancelKeyPress += (s, e) =>
            {
                e.Cancel = true;
                _isRunning = false;
            };

            try
            {
                RunLoopbackEngine(targetPid, loopbackMode, pipeName);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(string.Format("[PulseCord Audio Filter] Error: {0}\n{1}", ex.Message, ex.StackTrace));
            }
        }

        private static void RunLoopbackEngine(uint targetPid, PROCESS_LOOPBACK_MODE loopbackMode, string pipeName)
        {
            IAudioClient audioClient = null;

            // Attempt 1: Windows 10 (20348+) / Windows 11 Per-Process Exclusion Loopback
            try
            {
                audioClient = TryActivateProcessLoopback(targetPid, loopbackMode);
                Console.WriteLine("[PulseCord Audio Filter] Using Kernel Process-Exclusion WASAPI Loopback.");
            }
            catch (Exception ex)
            {
                Console.WriteLine(string.Format("[PulseCord Audio Filter] Process Loopback notice: {0}. Using Standard WASAPI Loopback.", ex.Message));
            }

            // Attempt 2: Standard Master WASAPI Loopback (Universal on ALL Windows versions)
            if (audioClient == null)
            {
                audioClient = ActivateStandardLoopback();
                Console.WriteLine("[PulseCord Audio Filter] Using Master Default Endpoint WASAPI Loopback.");
            }

            IntPtr pFormat;
            audioClient.GetMixFormat(out pFormat);

            Guid sessionGuid = Guid.Empty;
            int hr = audioClient.Initialize(
                NativeMethods.AUDCLNT_SHAREMODE_SHARED,
                NativeMethods.AUDCLNT_STREAMFLAGS_LOOPBACK,
                10000000, // 1 second buffer
                0,
                pFormat,
                ref sessionGuid);

            if (hr != 0)
            {
                throw new InvalidOperationException(string.Format("IAudioClient.Initialize failed with HRESULT: 0x{0:X8}", hr));
            }

            Guid iidCaptureClient = new Guid("C8ADBD64-E71E-48a0-A4DE-185C395CD317");
            IntPtr pCaptureClient;
            audioClient.GetService(ref iidCaptureClient, out pCaptureClient);
            IAudioCaptureClient captureClient = (IAudioCaptureClient)Marshal.GetObjectForIUnknown(pCaptureClient);

            Console.WriteLine("[PulseCord Audio Filter] Starting Named Pipe server stream...");

            using (NamedPipeServerStream pipeStream = new NamedPipeServerStream(pipeName, PipeDirection.Out, 1, PipeTransmissionMode.Byte, PipeOptions.Asynchronous))
            {
                Console.WriteLine(string.Format("[PulseCord Audio Filter] Waiting for PulseCord Electron connection on \\\\.\\pipe\\{0}...", pipeName));

                var asyncResult = pipeStream.BeginWaitForConnection(null, null);
                while (_isRunning && !asyncResult.IsCompleted)
                {
                    Thread.Sleep(30);
                }

                if (!_isRunning) return;

                pipeStream.EndWaitForConnection(asyncResult);
                Console.WriteLine("[PulseCord Audio Filter] PulseCord Electron connected!");

                audioClient.Start();
                Console.WriteLine("[PulseCord Audio Filter] Audio streaming active.");

                byte[] buffer = new byte[8192];

                while (_isRunning && pipeStream.IsConnected)
                {
                    uint nextPacketSize;
                    captureClient.GetNextPacketSize(out nextPacketSize);

                    while (nextPacketSize > 0)
                    {
                        IntPtr pData;
                        uint numFramesToRead;
                        uint flags;
                        ulong devicePos, qpcPos;

                        hr = captureClient.GetBuffer(out pData, out numFramesToRead, out flags, out devicePos, out qpcPos);
                        if (hr == 0 && numFramesToRead > 0)
                        {
                            int bytesToRead = (int)(numFramesToRead * 8); // 4 bytes/float * 2 channels (stereo float)
                            if (bytesToRead > buffer.Length)
                            {
                                buffer = new byte[bytesToRead];
                            }

                            if ((flags & 0x01) != 0) // AUDCLNT_BUFFERFLAGS_SILENT
                            {
                                Array.Clear(buffer, 0, bytesToRead);
                            }
                            else
                            {
                                Marshal.Copy(pData, buffer, 0, bytesToRead);
                            }

                            try
                            {
                                pipeStream.Write(buffer, 0, bytesToRead);
                            }
                            catch (IOException)
                            {
                                break;
                            }

                            captureClient.ReleaseBuffer(numFramesToRead);
                        }

                        captureClient.GetNextPacketSize(out nextPacketSize);
                    }

                    Thread.Sleep(5); // ~200Hz polling rate for low latency
                }

                audioClient.Stop();
            }

            Console.WriteLine("[PulseCord Audio Filter] Engine stopped cleanly.");
        }

        private static IAudioClient TryActivateProcessLoopback(uint targetPid, PROCESS_LOOPBACK_MODE loopbackMode)
        {
            AUDIOCLIENT_ACTIVATION_PARAMS activationParams = new AUDIOCLIENT_ACTIVATION_PARAMS
            {
                ActivationType = AUDIOCLIENT_ACTIVATION_TYPE.AUDIOCLIENT_ACTIVATION_TYPE_PROCESS_LOOPBACK,
                ProcessLoopbackParams = new AUDIOCLIENT_PROCESS_LOOPBACK_PARAMS
                {
                    TargetProcessId = targetPid,
                    ProcessLoopbackMode = loopbackMode
                }
            };

            int sizeOfParams = Marshal.SizeOf(typeof(AUDIOCLIENT_ACTIVATION_PARAMS));
            IntPtr pParams = Marshal.AllocHGlobal(sizeOfParams);
            Marshal.StructureToPtr(activationParams, pParams, false);

            PROPVARIANT propvar = new PROPVARIANT
            {
                vt = NativeMethods.VT_BLOB,
                blob_cbSize = (uint)sizeOfParams,
                blob_pData = pParams
            };

            IntPtr pPropvar = Marshal.AllocHGlobal(Marshal.SizeOf(typeof(PROPVARIANT)));
            Marshal.StructureToPtr(propvar, pPropvar, false);

            var completionHandler = new AudioInterfaceCompletionHandler();
            Guid iidAudioClient = new Guid("1CB9A8F9-724E-4680-A542-99663E0E4D96");
            IActivateAudioInterfaceAsyncOperation asyncOp;

            try
            {
                int activateHr = NativeMethods.ActivateAudioInterfaceAsync(
                    NativeMethods.VIRTUAL_AUDIO_DEVICE_PROCESS_LOOPBACK,
                    iidAudioClient,
                    pPropvar,
                    completionHandler,
                    out asyncOp);

                if (activateHr != 0)
                {
                    throw new InvalidOperationException(string.Format("0x{0:X8}", activateHr));
                }

                if (!completionHandler.Wait(3000) || completionHandler.ActivatedInterface == IntPtr.Zero)
                {
                    throw new InvalidOperationException(string.Format("Completion 0x{0:X8}", completionHandler.ResultHResult));
                }

                return (IAudioClient)Marshal.GetObjectForIUnknown(completionHandler.ActivatedInterface);
            }
            finally
            {
                Marshal.FreeHGlobal(pParams);
                Marshal.FreeHGlobal(pPropvar);
            }
        }

        private static IAudioClient ActivateStandardLoopback()
        {
            IMMDeviceEnumerator enumerator = (IMMDeviceEnumerator)new MMDeviceEnumerator();
            IMMDevice device;
            int hr = enumerator.GetDefaultAudioEndpoint(EDataFlow.eRender, ERole.eConsole, out device);
            if (hr != 0 || device == null)
            {
                throw new InvalidOperationException(string.Format("GetDefaultAudioEndpoint failed: 0x{0:X8}", hr));
            }

            Guid iidAudioClient = new Guid("1CB9A8F9-724E-4680-A542-99663E0E4D96");
            IntPtr pAudioClient;
            uint CLSCTX_ALL = 23; // CLSCTX_INPROC_SERVER | CLSCTX_INPROC_HANDLER | CLSCTX_LOCAL_SERVER
            hr = device.Activate(ref iidAudioClient, CLSCTX_ALL, IntPtr.Zero, out pAudioClient);
            if (hr != 0 || pAudioClient == IntPtr.Zero)
            {
                throw new InvalidOperationException(string.Format("IMMDevice.Activate failed: 0x{0:X8}", hr));
            }

            return (IAudioClient)Marshal.GetObjectForIUnknown(pAudioClient);
        }
    }
}
