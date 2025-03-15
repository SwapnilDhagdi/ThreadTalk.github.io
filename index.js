import express from "express";
import bodyparser from "body-parser";
import path, { extname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { Server } from "socket.io";
import session from "express-session";
import multer from "multer";
import fs from "fs";
import http from "http";
import dotenv from "dotenv";
dotenv.config();
const db=new pg.Client(
    {
        user:`${process.env.use}`,
        host:`${process.env.host}`,
        port:`${process.env.port}`,
        password:`${process.env.pass}`,
        database:`${process.env.dbname}`
    }
);
db.connect();

const app = express();
const server = http.createServer(app);
const io =new Server(server);
// Define path variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
var currentuser;
var currentcommunity;
app.use(bodyparser.urlencoded({extended:true}));
// Serve static files (css, js, etc.) from the "public" folder
app.use(
    session({
        secret:" no_secret",
        resave:false,
        saveUninitialized:true,
        cookie:{secure:false},
    })
);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use((req,res,next)=>
{
    res.setHeader('cache-control','no-store','no-cache','mustrevalidate','private');
    next();
});
app.use('/avatar',express.static(path.join(__dirname,"public","avatar")));
// Set the view engine to ejs and specify the location of the views folder
app.use('/post_upload',express.static(path.join(__dirname,"public","post_upload")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "public", "views"));

// Define routes

const Avatar=multer.diskStorage({
    destination: (req,file,cb)=>{
        cb(null,path.join(__dirname,"public","avatar"));
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now()+path.extname(file.originalname));
    },
});
const post_upload=multer.diskStorage({
    destination:(req,file,cb)=>
    {
        cb(null,path.join(__dirname,"public","post_upload"));
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now()+path.extname(file.originalname));
    }
});
const upload =multer({ storage:Avatar });
const post=multer({storage:post_upload});

io.on("connection",(socket)=>
{
    console.log("User connected",socket.id);

    socket.on("like",async (id)=>
    {
        var result=await db.query(`select * from post where pid=$1`,[id]);
        var like=result.rows[0].likes;
        var dislike=result.rows[0].dislikes;
        like+=1;
        if(dislike > 0)
        {
            dislike-=1;
        }

        await db.query(`update reaction set react='like' where pid=$1 and uid=$2 `,[id,currentuser]);
        await db.query(`update post set likes=$1 ,dislikes=$2 where pid= $3 and uid=$4`,[like,dislike,id,currentuser]);
       
        socket.emit("change",like,dislike,id);
    });

    socket.on("dislike",async (id)=>
    {

     
        var result=await db.query(`select * from post where pid=$1`,[id]);
        var like=result.rows[0].likes;
        var dislike=result.rows[0].dislikes;
        if(like>0)
        {
            like-=1;
        }   
        dislike+=1;
        await db.query(`update reaction set react='dislike' where pid=$1 and uid=$2`,[id,currentuser]);
        await db.query(`update post set likes=$1, dislikes=$2 where pid= $3 and uid=$4 `,[like,dislike,id,currentuser]);
    
        socket.emit("change",like,dislike,id);
    });
    socket.on("likes",async(id)=>{
        if((await db.query(`select * from reaction where pid=$1 and uid=$2`,[id,currentuser])).rows.length == 0){
            var result=await db.query(`select * from post where pid=$1`,[id]);
            var like=result.rows[0].likes;
            like+=1;
            await db.query(`insert into reaction(uid,pid,react) values($1,$2,'like')`,[currentuser,id]);
            await db.query(`update post set likes=$1 where pid= $2`,[like,id]);
            socket.emit("change",result.rows[0].dislike,like,id);
        }
    
    });
    socket.on("dislikes",async (id)=>
    {
        if((await db.query(`select * from reaction where pid=$1`,[id])).rows.length ==0)
        {
            var result=await db.query(`select * from post where pid=$1`,[id]);
            var dislike=result.rows[0].dislikes;
            dislike+=1;
            await db.query(`insert into reaction(uid,pid,react) values($1,$2,'dislike')`,[currentuser,id]);
            await db.query(`update post set dislikes=$1 where pid= $2`,[dislike,id]);
            socket.emit("change",result.rows[0].likes,dislike,id);
        }        
    });
    socket.on("add",async(comment,id)=>{
        await db.query(`insert into comment_section(username,comment,pid) values($1,$2,$3)`,[currentuser,comment,id]);
    });
});

app.get("/",async (req, res) => {
    
    const result=await db.query("select * from post");
    const communities=await db.query("select * from community");
    if(req.session.user)
    {
        res.render("index",{islogin:true,data:result.rows,community:communities.rows});
    }
    else
    {
        res.render("index",{islogin:false,data:result.rows,community:communities.rows});
    } 
});
app.get("/post",(req,res)=>
{
    res.render("post",{title:""});
});
app.get("/load_post/:id",async (req,res)=>
{
    const post=await db.query(`select * from post where pid=$1`,[req.params.id]);
    const comment=await db.query(`select username,comment from comment_section where pid=${req.params.id}`);
    res.render("user_post",{data:post.rows,comments:comment.rows});
});

app.get("/myaccount",async (req,res)=>
{
    if (!req.session.user) {
        console.log("Not found");
    }
    const result=await db.query(`select * from post join ruser on  post.uid=ruser.username where ruser.username=$1`,[currentuser]);
    const file=await db.query(`select avatar from ruser where username=$1`,[currentuser]);
    const mediabase64=file.rows[0].avatar.toString("base64");
    const mediadata=`data:image/jpg;base64,${mediabase64}`;
    const communities=await db.query("select * from community");

    res.render("account",{islogin:true,data:result.rows,avatar:mediadata,community:communities.rows});
});
app.post("/media",upload.single("media"),async (req,res)=>
{
    if(!req.file)
    {
        return res.status(400).send("No file uploaded");
    }
    const title=req.body.title;
    const file_data=fs.readFileSync(req.file.path);
    await db.query(`insert into demo(media) values($1)`,[file_data]);
    const result =await db.query("select * from demo");
    const file=result.rows[0];
    const mediabase64=file.media.toString("base64");
    const mediadata=`data:image/jpg;base64,${mediabase64}`;
  
    fs.unlink(req.file.path, (err) => {
        if (err) {
            console.error("Error deleting file:", err);
        } else {
            console.log("`File deleted from upload directory");
        }
    });
    res.render("img",{media:mediadata});
});
app.post("/post",post.single("media"),async(req,res)=>
{
    if(req.file)
    {
        const binary=fs.readFileSync(req.file.path);
        const mediabase64=binary.toString("base64");
        const mediadata=`data:image/jpg;base64,${mediabase64}`;
        await db.query(`insert into post(title,description,uid,media,likes,dislikes) values($1,$2,$3,$4,0,0)`,[req.body.title,req.body.description,currentuser,mediadata]);
       
    }
    else{
   
        await db.query(`insert into post(title,description,uid,likes,dislikes) values($1,$2,$3,0,0)`,[req.body.title,req.body.description,currentuser]);
    
    }res.redirect("/");
}); 
app.get("/logout",async (req,res)=>
{
   req.session.destroy((err)=>{
        if(err)
        {
            console.log("error in destroying session",err);
        }
    res.clearCookie("connect.sid");
    currentuser="";
   res.redirect("/signin");
   });
});
app.get("/c_post",(req,res)=>{
    res.render("community_post");
});
app.post("/community_post",post.single("media"),async(req,res)=>{
    if(req.file)
        {
            const binary=fs.readFileSync(req.file.path);
            const mediabase64=binary.toString("base64");
            const mediadata=`data:image/jpg;base64,${mediabase64}`;
            await db.query(`insert into post(title,description,uid,media,likes,dislikes,cid) values($1,$2,$3,$4,0,0,$5)`,[req.body.title,req.body.description,currentuser,mediadata,currentcommunity]);
        }
        else{
       
            await db.query(`insert into post(title,description,uid,cid,likes,dislikes) values($1,$2,$3,$4,0,0)`,[req.body.title,req.body.description,currentuser,currentcommunity]);
        
        }
        const community=await db.query(`select * from community where community_id=$1`,[currentcommunity]);
        const post=await db.query(`select * from post where cid=$1`,[currentcommunity]);
        res.render("community_place",{community_data:community.rows,data:post.rows});
});
app.get("/community_place/:cid",async(req,res)=>{
    const community=await db.query(`select * from community where community_id=$1`,[req.params.cid.substring(1)]);
    currentcommunity=req.params.cid.substring(1);
    const post=await db.query(`select * from post where cid=$1`,[req.params.cid.substring(1)]);
    res.render("community_place",{community_data:community.rows,data:post.rows});
});
app.get("/community",(req,res)=>{
    res.render("community");
});

app.post("/community",async(req,res)=>{
    const name=req.body.name;
    const description=req.body.description;
    await db.query(`insert into community(username,name,description) values($1,$2,$3)`,[currentuser,name,description]);
    res.redirect("/");
});
app.get("/search_community",async(req,res)=>{
    const query=req.query.q;
    try{
        const result=await db.query(`select name from community where LOWER(name) like $1 limit 6`,[`%${query.toLowerCase()}%`]);
        res.json(result.rows.map(row=>row.name));
    }
    catch(error){
        console.log(error);
        res.status(500).send("Internal server error ");
    }

});
app.get("/search_community_name",async (req,res)=>{
        const result=(await db.query(`select community_id from community where name=$1`,[req.query.q])).rows
        res.json(result);
});
app.get("/search", async (req, res) => {
    const query = req.query.q; // Extract the query string
    try {
      const result = await db.query(
        `SELECT title FROM post WHERE LOWER(title) LIKE $1 LIMIT 6`,
        [`%${query.toLowerCase()}%`]
      );
      res.json(result.rows.map(row => row.title)); // Return an array of titles
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  });
app.get("/signin",async (req,res)=>
{

    res.render("signin",{title:""});
});
app.post("/signin",async (req,res)=>{
    var result =await db.query(`select * from ruser where email=$1 and username=$2 and passwords=$3;`,[req.body.email,req.body.username,req.body.password]);
    if(result.rows.length===0)
    {
        res.render("signin",{title:"invalid credintial"});
    }
    else
    {
        req.session.user=result.rows[0];
        currentuser=result.rows[0].username;
        result=await db.query(`select * from post`);
        const communities=await db.query("select * from community");
        res.render("index",{islogin:true,data:result.rows,community:communities.rows});
    }
});

app.get("/home",(req,res)=>
{   
    currentcommunity="";
    res.redirect("/");
});

app.post("/submit",upload.single("media"),async (req,res)=>
    {
           
        if(!req.file)
        {
            return res.status(400).send("No file uploaded");
        }
        if(await Email(req.body))
        {
            fs.unlink(req.file.path, (err) => {
                if (err) {
                    console.error("Error deleting file:", err);
                } else {
                    console.log("`File deleted from upload directory");
                }
            });
            res.render("form",{title:"Email already present "});
        }
        else if(await Username(req.body))
        {
            fs.unlink(req.file.path, (err) => {
                if (err) {
                    console.error("Error deleting file:", err);
                } else {
                    console.log("`File deleted from upload directory");
                }
            });
            res.render("form",{title:"username already present "});
        }
        else
        {
            const file_data=fs.readFileSync(req.file.path);      
            await db.query(`insert into ruser(email,passwords,username,avatar) values($1,$2,$3,$4);`,[req.body.email,req.body.password,req.body.username,file_data]);
            var result=await db.query(`select * from ruser where email=$1 and username=$2 and passwords=$3`,[req.body.email,req.body.username,req.body.password]);
            req.session.user=result.rows[0];
            currentuser=result.rows[0].username;
            result =await db.query("select * from post");
            const communities=await db.query("select * from community");
            res.render("index",{islogin:true,data:result.rows,community:communities});
        }        
    }
);
app.get("/contact",async(req,res)=>{
    const result=await db.query("select * from post");
    const communities=await db.query("select * from community");
    res.render("contact",{islogin:true,data:result.rows,community:communities.rows});
});
app.get("/about",async(req,res)=>{
    const result=await db.query("select * from post");
    const communities=await db.query("select * from community");
    res.render("about",{islogin:true,data:result.rows,community:communities.rows});
});
app.get("/form",(req,res)=>
{
    res.render("form",{title:""});
});
const port = 3000;
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
//function to verfiy entry
async function Username(data)
{
    const username=await db.query("select Username from ruser;");
    const UsernameExists=username.rows.some(element=>element.username===data["username"]);

    if(UsernameExists)
    {
        return true;
    }
    return false;
} 
async function Email(data)
{
    const email=await db.query("select Email from ruser");
    const EmailExists=email.rows.some(element=>element.email===data["email"]);
    if(EmailExists)
    {
        return true;
    }
    return false;
}
