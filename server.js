const express = require('express');
const connectDB = require('./config/db.js');

const app = express()

//connnect daatbase
connectDB();

//Init Middleware
app.use(express.json({ extended: false }))

app.get('/', (req, res) => res.send(`API Running`));

// define routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));