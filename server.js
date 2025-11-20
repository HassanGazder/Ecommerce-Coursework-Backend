const express = require('express');
const app = express();

app.use(express.json())
app.set('PORT',3000);
app.use ((req,res,next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    next();
})

const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
let db;
MongoClient.connect('mongodb+srv://hassan:hassangazder321@cluster0.7qjb5ax.mongodb.net',(err,client)=>{
    db = client.db('webstore');
})

app.get('/', (req,res,next)=>{
    res.send('Hello World');
});

app.param('collectionName',(req,res, next ,collectionName) =>{
    req.collection = db.collection(collectionName);
    return next();
});

app.get('/collection/:collectionName', (req,res,next)=>{
    req.collection.find({}).toArray((e,results)=>{
        if(e) return next(e);
        res.send(results);
    });
});
// adding post method to add data to database
app.post('/collection/:collectionName', (req,res,next)=>{
    req.collection.insert(req.body,(e,result)=>{
        if(e) return next(e);
        res.send(result.ops);
    });
});
app.get('/collection/:collectionName/:id',(req,res,next)=>{
    req.collection.findOne({_id: new ObjectId(req.params.id)},(e,result)=>{
        if(e) return next(e);
        res.send(result);
    })});

app.put('/collection/:collectionName/:id',(req,res,next)=>{
    req.collection.update(
        {_id: new ObjectId(req.params.id)},
        {$set:req.body},
        {safe:true,mutli:false},
        (e,result)=>{
            if (e) return next(e);
            res.send((result.result.n ===  1)? {msg:'success'} : {msg:'error'});
        }

    )
})    
app.delete('/collection/:collectionName/:id',(req,res,next)=>{
    req.collection.deleteOne(
        {_id: new ObjectId(req.params.id)},
        {$set:req.body},
        (e,result)=>{
            if(e) return next(e);
            res.send(result);
        }
    )
})

app.listen(3000,()=>{
    console.log(`Server started on port ${app.get('PORT')}`);
});