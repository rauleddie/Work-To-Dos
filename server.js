// Load The Modules Needed For The Application.

const fs = require('fs'),
express = require('express'),
hbs = require('hbs'),
bodyParser = require('body-parser'),
uuid = require('uuid');
port = process.env.PORT || 3000;
// ------------------------------------------------------------- //

const dateFormat = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
};

// Set The Handlebars Templates And Express App

const app = express(),
urlencodedParser = bodyParser.urlencoded({extended : false});

app.set('view-engine', 'hbs');

app.use(express.static(`${__dirname}/public`));

app.use(express.static(`${__dirname}/public/imgs`));

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended: false
}));

// ------------------------------------------------------------- //

// Define Our Handlebars Helpers

hbs.registerHelper('addScriptTag', () => `./js/app.js`);

hbs.registerHelper('addLinkTag', () => `./css/styles.css`);

// Check For The Database

let tasksArr, historyArr;

(function () {
    if(!fs.existsSync(`${__dirname}/tasks_Database/tasks.json`)) {
        writeJSONDatabase('tasks.json', []);
        tasksArr = [];
    }
    tasksArr = JSON.parse(readJSONDatabase('tasks'));

    if(!fs.existsSync(`${__dirname}/tasks_Database/task-history.json`)) {
        writeJSONDatabase('task-history', [])

        historyArr = [];
    }
    historyArr = JSON.parse(readJSONDatabase('task-history'));

})();

// ------------------------------------------------------------- //
// Define Our Middleware

hbs.registerPartials(`${__dirname}/views/partials`)

// ------------------------------------------------------------- //

// Define Our GET Handlers

app.get('/', (req, res) => {
    res.render('index.hbs');
});

app.get('/getTasks', (req, res) => {
    res.json(JSON.parse(readJSONDatabase('tasks'))).end()
});

app.get('/getHistory', (req, res) => {
    res.json(JSON.parse(readJSONDatabase('task-history'))).end();
});

// ------------------------------------------------------------- //

// Define Our PUT Handlers

app.put('/addTask', (req, res) => {

    const formData = req.body;
    const task = {
        Id : uuid.v4(),
        Title : formData.Title,
        Body : formData.Body,
        Date : new Date().toLocaleString('en-US', dateFormat),
        State : 'Uncompleted'
    };

    tasksArr.push(task);
    historyArr.push(task);

    const stat = writeJSONDatabase('tasks', tasksArr);

    if(stat === 200) writeJSONDatabase('task-history', historyArr);

    res.status(stat).json(task).end();
    
});

app.put('/editTask', (req, res) => {
    const id = req.body.editObj.Id;
    let respTask;

    tasksArr.forEach( task => {
        if(task.Id === id) {
            task.Title = req.body.Title;
            task.Body = req.body.Body;
        }
    });

    historyArr.forEach( task => {
        if(task.Id === id) {
            respTask = task;
            task.Title = req.body.Title;
            task.Body = req.body.Body;
        }
    });

    const stat = writeJSONDatabase('tasks', tasksArr);
    if(stat === 200) writeJSONDatabase('task-history', historyArr);

    res.status(stat).json(respTask).end();
}) 

// ------------------------------------------------------------- //

// Define Our DELETE Handlers

app.delete('/deleteTask', (req, res) => {
    const taskId = req.body.Id;
    let respTask;

    tasksArr = tasksArr.filter( task => {
        if(task.Id === taskId) {
            respTask = task;
            respTask.State = req.body.Done ? 'Completed' : 'Deleted';
            respTask.stateDate = new Date().toLocaleString('en-US', dateFormat);
            return false;
        }
        return true;
    });

    const stat = writeJSONDatabase('tasks', tasksArr);

    if(stat === 200) {
        historyArr.forEach( task => {
            if(task.Id === req.body.Id) {
                task.State = req.body.Done ? 'Completed' : 'Deleted';
                task.stateDate = new Date().toLocaleString('en-US', dateFormat);
            }
        });
        
        writeJSONDatabase('task-history', historyArr);
    }
    res.status(stat).json(respTask).end();

});

app.delete('/deleteAll', (req, res) => {
    const taskIds = req.body.ids;
    const stat = writeJSONDatabase('tasks', []);

    if(stat === 200) {
        tasksArr = [];

        // Modify the task history array.
        taskIds.forEach( id => {
            historyArr.forEach( task => {
                if(task.Id === id) {
                    task.State = 'Deleted';
                    task.stateDate = new Date().toLocaleString('en-US', dateFormat);
                }
            });
        });
    }
    

    writeJSONDatabase('task-history', historyArr);

    res.status(stat).json(historyArr).end();
});

app.delete('/deleteHistory', (req, res) => {

    const stat = writeJSONDatabase('task-history', []);

    historyArr = [];

    res.status(stat).json({
        deleted : true
    }).end();

});

// Define Utility Functions

function writeJSONDatabase(fileName, fileValue) {
    fs.writeFileSync(`${__dirname}/tasks_Database/${fileName}.json`, JSON.stringify(fileValue), err => {
        console.log('Unable to rewrite text file');
        return 404;
    });
    return 200;
}

function readJSONDatabase(fileName) {
     return fs.readFileSync(`${__dirname}/tasks_Database/${fileName}.json`, err => {
                console.log(err);
            });
}

app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});