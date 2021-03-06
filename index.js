const express = require('express')
const mysql = require('mysql')

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

let con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: 'smart'
});

app.post('/api/v1/registration', (req, res) => {

    let username = req.body.username
    let fullname = req.body.fullname
    let password = req.body.password
    let role = req.body.role


    con.query('select * from users where username=?', [
        username
    ], (err, rows, fields) => {
        if (err) throw new Error(err)

        // If username is already taken
        if (rows.length != 0) {
            res.json({ status: 'Failed', message: 'Username is already taken' })
        } else {
            // Username is available, Register user
            con.query("insert into users values (null, ?, ?, 'null', ?, ?);", [
                username, fullname, password, role
            ], (err, Rows, Fields) => {
                if (err) throw new Error(err)

                res.json({ status: 'success' })
            })
        }
    })
})


app.post('/api/v1/setEmail', (req, res) => {
    let username = req.body.username
    let email = req.body.email

    con.query('update users set email=? where username=?', [
        email, username
    ], (err, rows, fields) => {
        if (err) throw new Error(err)

        res.json({ status: 'success' })
    })

})


app.post('/api/v1/login', (req, res) => {
    let username = req.body.username
    let password = req.body.password

    con.query('select * from users where username=? and password=?;', [username, password],
        (err, rows, fields) => {
            if (err) throw new Error(err)

            if (rows.length != 0) {
                let data = {
                    'role': rows[0].role
                }

                res.json({ status: 'success', data })
            } else {
                res.json({ status: 'Failed', message: 'Wrong username or password' })
            }
        })
})

app.post('/api/v1/setLocation', (req, res) => {
    let lat = req.body.latitude
    let lng = req.body.longitude
    let username = req.body.username

    // Check first if username is valid
    con.query('select * from users where username=?', [username], (Err, Rows, Fields) => {
        if (Err) throw new Error(Err)

        if (Rows.length != 0) {
            con.query('insert into locations values (null, ?, ?, ?);', [username, lat, lng],
                (err, rows, fields) => {
                    if (err) throw new Error(err)

                    res.json({ status: 'success' })
                })
        } else {
            res.json({ status: 'Failed', message: 'No user with username = ' + username })
        }
    })
})


app.post('/api/v1/getMechanicData', (req, res) => {
    let username = req.body.username

    con.query('select * from users where username=?;', [username],
        (err, rows, fields) => {
            if (err) throw new Error(err)

            if (rows.length != 0) {
                let response = {
                    status: 'success',
                    fullname: rows[0].fullName,
                    email: rows[0].email
                }

                // Get location
                con.query('select * from locations where username=?', [username],
                    (Err, Rows, Fields) => {
                        if (Err) throw new Error(Err)

                        if (Rows.length != 0) {
                            response.lat = Rows[0].lat
                            response.lng = Rows[0].lng
                        } else {
                            response.lat = 'null'
                            response.lng = 'null'
                        }

                        res.json(response)
                    })
            } else {
                res.json({ status: 'Failed', message: 'No user with username = ' + username })
            }


        })
})


app.post('/api/v1/getOwnerData', (req, res) => {
    let username = req.body.username

    con.query('select * from users where username=?', [username], (err, rows, fields) => {
        if (err) throw new Error(err)

        res.json({ status: 'success', fullname: rows[0].fullName})
    })
})


app.get('/api/v1/getMechanics', (req, res) => {
    
    con.query("SELECT * FROM `users` INNER JOIN locations where users.username = locations.username;", (err, rows, fields) => {
        if (err) throw new Error(err)

        let response = {
            status: 'success',
            Mechanics: new Array()
        }

        for (let index = 0; index < rows.length; index++) {
            const mechanic = rows[index];
            // Fetch lat and lng
            let fullname = mechanic.fullName
            let email = mechanic.email
            response.Mechanics.push({
                fullname,
                email,
                lat: mechanic.lat,
                lng: mechanic.lng
            })
        }

        res.json(response)
    })

})

app.listen(5000, () => console.log("Server is listening at 5000"))