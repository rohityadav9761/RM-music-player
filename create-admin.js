require('dotenv').config();
const bcryptjs = require('bcryptjs');
const { pool } = require('./database');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function createAdmin() {
  const question = (prompt) => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };

  try {
    console.log('\n=== Create Admin Account ===\n');
    
    const username = await question('Enter admin username: ');
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password: ');
    const confirmPassword = await question('Confirm admin password: ');

    if (password !== confirmPassword) {
      console.log('\n❌ Passwords do not match!');
      rl.close();
      process.exit(1);
    }

    if (!username || !email || !password) {
      console.log('\n❌ All fields are required!');
      rl.close();
      process.exit(1);
    }

    const connection = await pool.getConnection();
    const [existingAdmin] = await connection.query('SELECT * FROM admins WHERE username = ? OR email = ?', [username, email]);
    
    if (existingAdmin.length > 0) {
      connection.release();
      console.log('\n❌ Admin with this username or email already exists!');
      rl.close();
      process.exit(1);
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    await connection.query('INSERT INTO admins (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);
    connection.release();

    console.log('\n✅ Admin account created successfully!');
    console.log(`\n📋 Admin Details:`);
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`\n✨ You can now login at: http://localhost:3000/admin-login.html\n`);

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    rl.close();
    process.exit(1);
  }
}

createAdmin();
