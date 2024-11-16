const { Command } = require('commander');
const express = require('express');
const fs = require('fs');
const path = require('path');

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

// Використовуємо express.urlencoded для обробки x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Маршрут для тесту
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

// GET /notes/:name
app.get('/notes/:name', (req, res) => {
    const noteName = req.params.name;
    const notePath = path.join(options.cache, noteName);

    fs.readFile(notePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).send('Not found');
            }
            return res.status(500).send('Server error');
        }
        res.status(200).send(data);
    });
});

// PUT /notes/:name
app.put('/notes/:name', express.text(), (req, res) => {
    const noteName = req.params.name;
    const notePath = path.join(options.cache, noteName);
    const newText = req.body;

    fs.access(notePath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).send('Not found');
        }
        fs.writeFile(notePath, newText, (err) => {
            if (err) {
                return res.status(500).send('Server error');
            }
            res.status(200).send('Note updated');
        });
    });
});

// DELETE /notes/:name
app.delete('/notes/:name', (req, res) => {
    const noteName = req.params.name;
    const notePath = path.join(options.cache, noteName);

    fs.unlink(notePath, (err) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).send('Not found');
            }
            return res.status(500).send('Server error');
        }
        res.status(200).send('Note deleted');
    });
});

// GET /notes
app.get('/notes', (req, res) => {
    fs.readdir(options.cache, (err, files) => {
        if (err) {
            return res.status(500).send('Server error');
        }
        const notes = files.map((file) => ({
            name: file,
            text: fs.readFileSync(path.join(options.cache, file), 'utf8'),
        }));
        res.status(200).json(notes);
    });
});

// POST /write
app.post('/write', (req, res) => {
    const noteName = req.body.note_name;
    const noteText = req.body.note;
    const notePath = path.join(options.cache, noteName);

    fs.access(notePath, fs.constants.F_OK, (err) => {
        if (!err) {
            return res.status(400).send('Note already exists');
        }
        fs.writeFile(notePath, noteText, (err) => {
            if (err) {
                return res.status(500).send('Server error');
            }
            res.status(201).send('Note created');
        });
    });
});

// Шлях до форми завантаження
app.get('/UploadForm.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'UploadForm.html'));
});
