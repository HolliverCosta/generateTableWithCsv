const express = require('express');
const db = require('./database/index');

const fastCsv = require('fast-csv');

const multer = require('multer');

const upload = multer({ dest: 'uploads/' })

const app = express();
app.use(express.json())

app.post('/dados/:label', upload.single('csv'), async (req, res) => {
  const { label }  = req.params;

  var retorno = [];
  
  fastCsv.parseFile("municipios.csv",{
    headers: true,
    delimiter: ';'
  })
  .on('data', data => {
    retorno.push(data)
  }).on('end', async ()=>{
    const colunas = Object.keys(retorno[0]);
    console.log(colunas)
    var query= ''; 
    
    colunas.map((coluna)=>{
      query = query + coluna + ' VARCHAR' + ','
    })
    await db.query(`
      CREATE TABLE IF NOT EXISTS ${label}(${query.substring(0,query.length-1)});
    `)
    
    retorno.map(async values => {
      await db.query(`
      INSERT INTO ${label}(${colunas})
      VALUES($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `, [values.exibicao,values.regiao,values.uf,values.municipio,values.latitude,values.longitude])
    })
    
  })

res.send('ok').status(200)
})

app.listen(8080, () => console.log("esta rodando na porta http://localhost:8080/"))