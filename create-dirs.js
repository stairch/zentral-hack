const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\Users\\ahmad\\Documents\\GitHub\\hack-zentral-website\\app\\api';

const directories = [
    'auth/signup',
    'auth/login',
    'auth/logout',
    'auth/2fa/send',
    'auth/2fa/verify',
    'newsletter',
    'hackathon/register',
    'admin/teams',
    'admin/categories',
    'admin/email',
    'admin/documents'
];

console.log('Creating directories under:', baseDir);
console.log('');

directories.forEach(dir => {
    const fullPath = path.join(baseDir, dir);
    try {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log('✓ Created:', fullPath);
    } catch (err) {
        if (err.code === 'EEXIST') {
            console.log('✓ Already exists:', fullPath);
        } else {
            console.error('✗ Error creating:', fullPath, err.message);
        }
    }
});

console.log('');
console.log('All directories created successfully!');
