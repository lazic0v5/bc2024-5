const { Command } = require('commander');
const express = require('express');

const program = new Command();

// Опис параметрів командного рядка
program
    .requiredOption('-h, --host <host>', 'адреса сервера')
    .requiredOption('-p, --port <port>', 'порт сервера')
    .requiredOption('-c, --cache <path>', 'шлях до директорії для кешу');

program.parse(process.argv);

const options = program.opts();

console.log('Параметри:');
console.log(`Host: ${options.host}`);
console.log(`Port: ${options.port}`);
console.log(`Cache directory: ${options.cache}`);

const app = express();

app.get('/', (req, res) => {
    res.send('Сервер працює!');
});

app.listen(options.port, options.host, () => {
    console.log(`Сервер запущено на http://${options.host}:${options.port}`);
});

if (!options.host || !options.port || !options.cache) {
    console.error('Помилка: Усі параметри (-h, -p, -c) є обов’язковими!');
    process.exit(1); // Завершуємо програму з кодом помилки
}
