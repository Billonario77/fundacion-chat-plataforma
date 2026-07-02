import bcrypt from 'bcrypt';

const password = 'Admin123!';
const saltRounds = 10;

bcrypt.hash(password, saltRounds).then(hash => {
    console.log('Contraseña:', password);
    console.log('Hash:', hash);
});