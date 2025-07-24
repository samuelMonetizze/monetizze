const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Configurações do ClickUp
const CLICKUP_TOKEN = 'pk_170417542_QBOLR58Y227D35OTCYY8G7FS935EVVP8';
const LIST_ID = '901704865064';
const CAMPOS = {
  codigo_produto: '0ee04080-5486-4f1b-9dcc-0d5ae960ef33',
  pagina_venda: '98fdc688-d144-4711-be2f-6decc0de866e',
  nm_produtor: 'e4661ac8-c953-4023-8390-a6dc86f642d0',
  observacoes: '7d0c4606-3c20-4088-9a66-1fd1972bfe54'
};
const OBS_INTERNACIONAL_ID = 'c2ed4b0e-0b38-447b-bba9-884eb85e2fa0';
const OBS_NACIONAL_ID = '90641a07-70dc-49ba-b179-145af1912d20';

app.get('/', (req, res) => {
  res.render('index', { resultados: null });
});

app.post('/upload', upload.single('file'), async (req, res) => {
  const tipo = req.body.tipo;
  const filePath = req.file.path;
  let resultados = [];
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    for (const item of data) {
      let nome_tarefa, descricao, custom_fields;
      if (tipo === 'nacional') {
        nome_tarefa = `NACIONAL - ${item.cd_produto || ''} - ${item.nm_produto || ''}`;
        custom_fields = [
          { id: CAMPOS.codigo_produto, value: String(item.cd_produto || '') },
          { id: CAMPOS.pagina_venda, value: item.pagina_venda || '' },
          { id: CAMPOS.nm_produtor, value: item.nm_produtor || '' },
          { id: CAMPOS.observacoes, value: OBS_NACIONAL_ID }
        ];
      } else {
        nome_tarefa = `${item.cd_produto} - ${item.nm_produto}`;
        custom_fields = [
          { id: CAMPOS.codigo_produto, value: String(item.cd_produto) },
          { id: CAMPOS.pagina_venda, value: item.pagina_venda },
          { id: CAMPOS.nm_produtor, value: item.nm_produtor },
          { id: CAMPOS.observacoes, value: OBS_INTERNACIONAL_ID }
        ];
      }
      descricao = `Data da primeira venda: ${item.dt_primeira_venda}\nPágina de vendas: ${item.pagina_venda}`;
      const payload = {
        name: nome_tarefa,
        description: descricao,
        custom_fields
      };
      try {
        const response = await axios.post(
          `https://api.clickup.com/api/v2/list/${LIST_ID}/task`,
          payload,
          { headers: { Authorization: CLICKUP_TOKEN, 'Content-Type': 'application/json' } }
        );
        resultados.push({ tarefa: nome_tarefa, status: 'Criada com sucesso!' });
      } catch (err) {
        resultados.push({ tarefa: nome_tarefa, status: 'Erro: ' + (err.response?.data?.err || err.message) });
      }
    }
  } catch (e) {
    resultados.push({ tarefa: 'Erro ao processar arquivo', status: e.message });
  }
  fs.unlinkSync(filePath);
  res.render('index', { resultados });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
