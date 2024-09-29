const express=require('express');
const app=express();
const path=require('path')
const smokePath=path.join(__dirname,'smoke.db');
const {open}=require("sqlite")
const sqlite3=require('sqlite3')
let dbObject=null;
app.use(express.urlencoded({ extended: true }))
const connect=async ()=>{
    try{
        dbObject=await open({
            filename:smokePath,
            driver:sqlite3.Database
        })
        await dbObject.exec(`
            CREATE TABLE IF NOT EXISTS User (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS Address (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                address TEXT NOT NULL,
                FOREIGN KEY(userId) REFERENCES User(id)
            );
        `);
        app.listen(3004,()=>{console.log("listening")})
    }
    catch(e){
        console.log("error is ",e);
    }
}
connect();
app.get('/',(request,response)=>{
     response.sendFile('./form.html',{root:__dirname})
})
app.post('/register', async (request, response) => {
    const { name, address } = request.body;
    console.log(name,address)
    try {
        const existingUser = await dbObject.get('select * from User where name = ?', [name]);
        if (existingUser) {   
            return response.status(400).send('User already exists.');
        }
        const result = await dbObject.run('insert into User (name) values (?)', [name]);
        const userId = result.lastID; 
        await dbObject.run('insert into Address (userId, address) values (?, ?)', [userId, address]);

        response.send('User and Address have been successfully added!');
    } catch (e) {
        console.log('Error:', e);
        response.status(500).send('An error occurred while inserting data.');
    }
});
