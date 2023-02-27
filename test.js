const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgres://eszxtlkc:A_JasSj0TsHlzTLf7H5ii4XJRuzwYmjP@suleiman.db.elephantsql.com/eszxtlkc',
    ssl: {
        rejectUnauthorized: false
    }
});

client.connect((err) => {
    if (err) {
        console.error('Error connecting to database', err);
    } else {
        console.log('Connected to database');
    }
});

client.query(`INSERT INTO resume (first_name, last_name, address, city, state, zipcode, resume_link)
VALUES ('John', 'Doe', '123 Main St', 'Anytown', 'CA', '12345', 'http://example.com/resume.pdf');`
    , (err, res) => {
        if (err) {
            console.error('Error running query', err);
        } else {
            console.log('Query result:', res.rows);
        }
    });