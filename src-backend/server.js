//importing
import express from 'express';
import mongoose from 'mongoose';
import Pusher from "pusher";
import Messages from './dbMessages.js';
import cors from 'cors';

//app config
const app = express();      //created application instance
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1079799",
  key: "c7af74d7f260cc1a7529",
  secret: "dcfbdd3687f645ea692f",
  cluster: "ap2",
  encrypted: true,
});

//middlewares
app.use(express.json());
app.use(cors());


// DB config
const connection_url ="mongodb+srv://admin:8gmYTFjUQvTasyGI@cluster0.b0a58.mongodb.net/<dbname>?retryWrites=true&w=majority";
mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection

db.once('open', () =>  {
    console.log("DB connected");

    const msgCollection = db.collection('messagecontents');
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log('A change occured',change);
    if (change.operationType === 'insert') {
        const messageDetails = change.fullDocument;
        pusher.trigger('messages', 'inserted',
            {
                name: messageDetails.user,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received,
            });
    } else {
        console.log('Error triggering Pusher');
    }    
    });
});

// ????

//api routes
app.get('/', (req, res) => res.status(200).send('hello world'));

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    });
});



//listener
app.listen(port, () => console.log('Listening on localhost:${port}'));