const { log } = require("console")
const express = require("express")
const fs = require("fs")
const uuid = require("uuid")
const jwt= require("jsonwebtoken")

// VARIABLES DE ENTORNO
SIGNATURE = "cNmZ%ik/F0;gc,nz1Y#UfrA*4/z.F]}y"
PORT = 3000

// RUTAS (LO ÚNICO QUE DEBERÍA ESTAR EN ESTE ARCHIVO)
app = express()

app.use(express.urlencoded())
app.use(express.json())

app.get("/api/messages", (req, res) => {
    let role = ""
    try {
    role = middleware(req.headers.authorization.split(" ")[1])
    } catch {
        res.json(401, {
            "ok": false,
            "msg": "Not allowed to be there"
        })
    }
    if (role == "admin" || role == "editor" || role == "viewer"){ 
        array = get_messages()
        res.json({
            "ok": true,
            "data": array,
        })
    }
    else {
        res.json(401, {
            "ok": false,
            "msg": "Not allowed to be there"
        })
    }
})

app.post("/api/messages", (req, res) => {
    const {user, msg} = req.body
    let role = ""
    try {
        role = middleware(req.headers.authorization.split(" ")[1])
    } catch {
        res.json(401, {
            "ok": false,
            "msg": "Not allowed to be there"
        })
    }
    if (role == "admin" || role == "editor") {    
        if (post_message(user, msg) == true){
            res.json(201, {
                "ok": true,
                "msg": `Message from ${user} added correctly`
            })
        }
        else {
            res.json(500, {
                "ok": false,
                "msg": "Something failed."
            })
        }}
        else {
            res.json(401, {
                "ok": false,
                "msg": "Not allowed to be there"
            })
        }
    })
    
    app.delete("/api/messages/", (req, res) => {
        let role = ""
        try {
            role = middleware(req.headers.authorization.split(" ")[1])
        } catch {
            res.json(401, {
                "ok": false,
                "msg": "Not allowed to be there"
            })
        }
        if (role == "admin"){    
            id = req.query.id
            if (check_if_message_exists_by_id(id) == false) {
                console.log("El mensaje no existe")
                res.json({
                    "ok": false,
                "msg": "Something failed."
            })
        }
        else {
            messages = JSON.parse(fs.readFileSync("./data/messages.json"))
            delete messages[id]
            fs.writeFileSync("./data/messages.json", JSON.stringify(messages))
            res.json({
                "ok": true,
                "msg": `message with id ${id} was deleted`
            })
        }
    }
    else {
        res.json(401,{
            "ok": false,
            "msg": "Not allowed to be there"
        })
    }
})

app.post("/auth/signup", (req, res) => {
    const {username, password, role} = req.body
    if (post_user(username, password, role) != false){
        res.json(201, {
            "ok": true,
            "msg": `User ${username} correctly added as a ${role}`
        })
    }
    else {
        res.json(500, {
            "ok": false,
            "error": "Something failed."
        })
    }
})

app.post("/auth/signin", (req, res) => {
    const {username, password} = req.body
    if (check_if_user_exists_by_name(username) == false || username == undefined || password == undefined) {
        res.json({
            "ok": false,
            "msg": "User login incorrect"
        })
    }
    if (check_credentials(username, password) != false) {
        res.json({
            "ok": true,
            "JWT": token
        })
    }
    else {
        res.json({
            "ok": false,
            "msg": "User login incorrect"
        })
    }
})


app.listen(PORT, () => {
    console.log("server running in port 3000")
})


// FUNCIONES UTILIZADAS POR LAS RUTAS
function middleware(token){
    try {

        data = jwt.verify(token, SIGNATURE)
        return data.role
    } catch {
        return false
    }
}

function post_user(username, password, role) {
    if (check_if_user_exists_by_name(username) == false && username != undefined && password != undefined && role != undefined){
        if (role != "admin" && role != "viewer" && role != "editor") {
            return false
        }
        console.log(`Usuario ${username} creado`)
        user = new User(username, password, role)
        if ((fs.readFileSync("/root/api/data/users.json").length) > 0) {
            let obj = JSON.parse(fs.readFileSync("./data/users.json"))
            obj[user["id"]] = user
            fs.writeFileSync("/root/api/data/users.json",JSON.stringify(obj))
        }
        else {
            let obj = {}
            obj[user["id"]] = user
            fs.writeFileSync("/root/api/data/users.json",JSON.stringify(obj))
        }
        return user
    }
    else {
        return false
    }
}

function post_message(user, msg) {
    if((check_if_user_exists_by_name(user) != false && user != undefined && msg != undefined)){
        user_obj = check_if_user_exists_by_name(user)
        msg = new Message(user_obj, msg)
        if ((fs.readFileSync("/root/api/data/messages.json").length) > 0) {
            let obj = JSON.parse(fs.readFileSync("./data/messages.json"))
            obj[msg["id"]] = msg
            fs.writeFileSync("/root/api/data/messages.json", JSON.stringify(obj))
            return true
        }
        else {
            let obj = {}
            obj[`${msg.id}`] = msg
            fs.writeFileSync("/root/api/data/messages.json", JSON.stringify(obj))
            return true
        }
    }
    else {
        return false
    }
}


function check_if_user_exists_by_name(name){
    if ((fs.readFileSync("/root/api/data/users.json").length) > 0) {
        users = JSON.parse(fs.readFileSync("/root/api/data/users.json"))
        for (key in users) {
            if (users[key].username == name) {
                return users[key]
            }
        }
        return false
    }
    return false
}

function check_if_message_exists_by_id(id){
    messages = JSON.parse(fs.readFileSync("/root/api/data/messages.json"))
    console.log("messages got")
    for (key in messages) {
        if (key == id) {
            return messages[key]
        }
    }
    return false
}

function get_messages() {
    if ((fs.readFileSync("/root/api/data/messages.json").length) > 0) {
        messages = JSON.parse(fs.readFileSync("/root/api/data/messages.json"))
        array = []
        for (id in messages) {
            array.push(messages[id])
        }
        return array
    }
    else {
        return []
    }
}

function check_credentials(username, password) {
    users = JSON.parse(fs.readFileSync("/root/api/data/users.json"))
    for (key in users) {
        if (users[key].username == username && users[key].password == password) {
            token = jwt.sign({
                role: users[key].role,
            }, SIGNATURE)
            return token
        }
    }
    return false
}

// ENTIDADES

function User(username, password, role) {
    this.id = uuid.v4(),
    this.username = username,
    this.password = password,
    this.role = role
}


function Message(user, msg) {
    this.id = uuid.v4()
    this.user_id = user.id
    this.msg = msg
    this.user = user.username
}
