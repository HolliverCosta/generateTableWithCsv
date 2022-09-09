const express = require('express');
const db = require('./database/index');

const fastCsv = require('fast-csv');

const multer = require('multer');
const { query } = require('express');
const path = require('path');
const fs = require('fs');

const upload = multer({storage: multer.diskStorage({
  destination: path.resolve(__dirname,'uploads'),
  filename: (req, file, callback) => {
    const fileName = file.originalname;
    return callback(null, fileName);
  },
})});

const app = express();
app.use(express.json());

app.post('/dados/:label', upload.single('csv'), async (req, res) => {
  const { label }  = req.params;
  const { file } = req;

  var csv = [];

  fastCsv.parseFile(file.path,{
    headers: true,
    delimiter: ';'
  })
  .on('data', data => {
    csv.push(data);
  }).on('end', async ()=>{
    const colunas = Object.keys(csv[0]);

    var createQuery= ''; 
    
    colunas.map((coluna)=>{
      createQuery = createQuery + coluna + ' VARCHAR' + ','
    });

    await db.query(`
      CREATE TABLE IF NOT EXISTS ${label}(${createQuery.substring(0,createQuery.length-1)});
    `);

    var query = '';
    csv.map(async values => {
      var value = '';

      Object.values(values).map((i)=> {
        value = `${value},'${i}'`
      });

      query = query + `INSERT INTO ${label}(${colunas})
      VALUES(${value.substring(1, value.length)});`
    });
    await db.query(query);
  }).on('close', () => {
    fs.unlinkSync(file.path)

  })

  res.send('Tabela criada!').status(200);
})

app.listen(8080, () => console.log("esta rodando na porta http://localhost:8080/"));