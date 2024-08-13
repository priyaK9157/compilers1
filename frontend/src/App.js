// src/index.js or at the start of src/App.js
window.addEventListener('error', (event) => {
  if (event.message.includes('ResizeObserver loop')) {
    event.stopImmediatePropagation();
  }
});


// src/App.js
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Editor from '@monaco-editor/react';

const socket = io('https://compilers1.onrender.com')

const languageOptions = [
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'c', label: 'C' }
];

const defaultCodeSnippets = {
  python: `# Python default code snippet\nprint("Hello, world!")`,
  cpp: `// C++ default code snippet\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, world!" << std::endl;\n    return 0;\n}`,
  java: `// Java default code snippet\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, world!");\n    }\n}`,
  javascript: `// JavaScript default code snippet\nconsole.log("Hello, world!");`,
  c: `/* C default code snippet */\n#include <stdio.h>\n\nint main() {\n    printf("Hello, world!\\n");\n    return 0;\n}`
};

const App = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [code, setCode] = useState(defaultCodeSnippets['python']);
  const [input, setInput] = useState('');
  const [result, setResult] = useState('')

  useEffect(() => {
    // Set up Socket.IO event listeners
    socket.on('output', (data) => {
      setResult((prevResult) => prevResult + data);
    });

    return () => {
      socket.off('output');
    };
  }, []);

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    setSelectedLanguage(newLanguage);
    setCode(defaultCodeSnippets[newLanguage] || '');
  };

  const handleCodeChange = (value) => {
    setCode(value);
  };

  const handleInputChange = (event) => {
    setInput(event.target.value);
  };

  const handleSubmit = () => {
    if (!code.trim()) {
      alert('Code cannot be empty!');
      return;
    }

    if (!selectedLanguage) {
      alert('Please select a programming language!');
      return;
    }

    setResult('');
    // Emit the code and input to the server
    socket.emit('runCode', {
      language: selectedLanguage,
      code: code,
      input: input
    });
  };

  return (
    <div className="container mx-auto p-4 h-screen w-screen bg-slate-900 text-white overflow-x-hidden overflow-y-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className='flex gap-96'>
          <div className="mb-4 bg-slate-900 text-white">
            <label htmlFor="language" className="block text-sm font-medium text-white">Select Language:</label>
            <select
              id="language"
              value={selectedLanguage}
              onChange={handleLanguageChange}
              className="mt-1 block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-slate-900 text-white"
            >
              {languageOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>


          </div>


          <div>
              <button
                onClick={handleSubmit}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Submit
              </button>
          </div>
          </div>
          <div className="mb-4">
            <label htmlFor="code" className="block text-sm font-medium text-white-700">Enter Code:</label>
            <Editor
              height="390px"
              defaultLanguage={selectedLanguage}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              className="border border-gray-300 rounded-md mt-5 overflow-y-auto"
            />
          </div>
        </div>
        <div>
          <div className="mb-4 border border-white-400 p-3 mt-28">
            <label htmlFor="input" className="block text-sm font-medium text-white-700">Enter Input (if any):</label>
            <textarea
              id="input"
              value={input}
              onChange={handleInputChange}
              rows="5"
              className="mt-1 bg-slate-900 text-white block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            />
          </div>
          <div className="mt-4 p-4 h-48 max-w-[90%] border rounded bg-slate-900 overflow-y-auto">
            <h2 className="text-xl font-bold text-white">Output:</h2>
            <pre className="whitespace-pre-wrap break-words">{result}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
