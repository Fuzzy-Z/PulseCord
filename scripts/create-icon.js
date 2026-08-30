import fs from 'fs';

// Minimal 1x1 or valid PNG base64 to ensure electron builder icon exists
// Base64 of a 64x64 blue discord style icon PNG
const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAB0SURBVHgB7dexCQBACAMw+9/5fUeQzsZ5g4QW8K6qvqKjAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4p6e7Q6D6qLsDoPqouQNA89HqBoDmru0B0NzV3QBQ3bU9AKq72g0A1d3sAJB8tHoAJD81FwBq7toF4E+qT+50AHz7qLgZ8qYnAAAAAElFTkSuQmCC';

fs.writeFileSync('./public/icon.png', Buffer.from(base64Png, 'base64'));
console.log('icon.png created successfully');
