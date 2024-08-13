const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

app.use(cors());
app.use(express.json());

const languageMap = {
  python: {
    boilerplate: '',
    compile: null,
    run: (filePath, inputFile) => `python "${filePath}" < "${inputFile}"`
  },
  cpp: {
    boilerplate: `#include <bits/stdc++.h>\nusing namespace std;\n`,
    compile: (filePath) => `g++ "${filePath}" -o "${path.join(tempDir, 'a.out')}"`,
    run: (filePath, inputFile) => `"${path.join(tempDir, 'a.out')}" < "${inputFile}"`
  },
  c: {
    boilerplate: `#include <stdio.h>\n#include <math.h>\n`,
    compile: (filePath) => `gcc "${filePath}" -o "${path.join(tempDir, 'a.out')}"`,
    run: (filePath, inputFile) => `"${path.join(tempDir, 'a.out')}" < "${inputFile}"`
  },
  java: {
    boilerplate: '',
    compile: (filePath) => `javac "${filePath}"`,
    run: (filePath, inputFile) => `java -cp "${tempDir}" Main < "${inputFile}"`
  },
  javascript: {
    boilerplate: '',
    compile: null,
    run: (filePath, inputFile) => `node "${filePath}" < "${inputFile}"`
  }
};

io.on('connection', (socket) => {
  console.log('A client connected');

  socket.on('runCode', ({ language, code, input }) => {
    const langConfig = languageMap[language];
    if (!langConfig) {
      socket.emit('output', 'Unsupported language');
      return;
    }

    const fileName = getFileName(language);
    const filePath = path.join(tempDir, fileName);
    const inputFile = path.join(tempDir, 'input.txt');

    // Prepend boilerplate
    const finalCode = langConfig.boilerplate + code;

    console.log("finalCode",finalCode)

 

    fs.writeFileSync(filePath, finalCode);
    fs.writeFileSync(inputFile, input);

    const compileCommand = langConfig.compile ? langConfig.compile(filePath) : null;
    const executeCommand = langConfig.run(filePath, inputFile);

    const command = compileCommand ? `${compileCommand} && ${executeCommand}` : executeCommand;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Error executing code:', stderr);
        socket.emit('output', stderr);
      } else {
        socket.emit('output', stdout);
      }

      cleanUpFilesWithRetries(filePath, inputFile, 5, 1000);
    });
  });

  socket.on('disconnect', () => {
    console.log('A client disconnected');
  });
});

const getFileName = (language) => {
  switch (language) {
    case 'python':
      return 'temp.py';
    case 'cpp':
      return 'temp.cpp';
    case 'c':
      return 'temp.c';
    case 'java':
      return 'Main.java';
    case 'javascript':
      return 'temp.js';
    default:
      return 'temp.txt';
  }
};

const cleanUpFilesWithRetries = (filePath, inputFile, retries, delay) => {
  const tryUnlink = (file, attempt = 0) => {
    fs.unlink(file, (err) => {
      if (err) {
        if (err.code === 'EBUSY' && attempt < retries) {
          console.log(`Retrying to delete file: ${file} (Attempt ${attempt + 1})`);
          setTimeout(() => tryUnlink(file, attempt + 1), delay);
        } else {
          console.error('Error removing temporary file:', err);
        }
      }
    });
  };

  tryUnlink(filePath);
  tryUnlink(inputFile);
};

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
