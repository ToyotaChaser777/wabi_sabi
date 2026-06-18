const bcrypt = require('bcryptjs');

bcrypt.hash('lolkek999', 10).then(hash => {
    console.log(`INSERT INTO users (name, email, password, phone, is_admin) 
VALUES ('Администратор', 'igorkrg999333@gmail.com', '${hash}', '', 1);`);
});