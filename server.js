import express, { json } from 'express'
import cors from 'cors'
import fs from 'fs'

const app = express()
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}))
app.use(express.json())

const PORT = 3333
const FILE_PATCH = './participantes.json'

const lerParticipantes = (callback) => {
    fs.readFile(FILE_PATCH, 'utf-8', (err, dados) => {
        if (err) {
            if (err.code === 'ENOENT') {
                fs.writeFile(FILE_PATCH, '[]', () => callback([]))
            } else {
                return callback([]);
            }
        } else {
            callback(JSON.parse(dados || '[]'))
        }
    })
}

const salvarParticipantes = (dados, callback) => {
    fs.writeFile(FILE_PATCH, JSON.stringify(dados, null, 2), callback)
}

app.get('/participantes', (req, res) => {
    lerParticipantes((participantes) => {
        res.json(participantes)
    })
})

app.post('/participantes', (req, res) => {
    const { nome, email, senha, idade, cidade } = req.body

    lerParticipantes((participantes) => {
        const novoParticipante = {
            id: Date.now(),
            nome,
            email,
            senha,
            idade,
            cidade
        }
        if (novoParticipante.idade < 16) {
            return res.status(400).json({ mensagem: "Digite uma idade válida! Cadastro é feito apenas para maiores de 16 anos." })
        }
        participantes.push(novoParticipante)
        salvarParticipantes(participantes, (err) => {
            if (err) {
                res.status(500).json({ mensagem: 'Erro ao salvar o participante!' })
            }
            res.status(200).json(novoParticipante)
        })
    })
})

app.get('/participantes/count', (req, res) => {
    lerParticipantes((participantes) => {
        const contagemParticipantes = participantes.length
        res.status(200).json({ mensagem: `Contagem de participantes: ${contagemParticipantes}` })
    })
})

app.get('/participantes/count/over18', (req, res) => {
    lerParticipantes((participantes) => {
        const maioresDeIdade = participantes.filter(p => p.idade >= 18)
        fs.writeFile('./participantesOver18.json', JSON.stringify(maioresDeIdade, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ mensagem: 'Erro ao gravar no arquivo' });
            }
            res.status(200).json({
                quantidade: maioresDeIdade.length,
                participantes: maioresDeIdade
            });
        });
    });
})

app.get('/participantes/:id', (req, res) => {
    const id = Number(req.params.id);

    lerParticipantes((participantes) => {
        const participante = participantes.find(p => p.id === id);

        if (!participante) {
            return res.status(400).json({ mensagem: "Pessoa não encontrada" });
        }

        res.status(200).json(participante);
    })
})

app.put('/participantes/:id', (req, res) => {
    const id = Number(req.params.id);
    const { nome, email, senha, idade, cidade } = req.body;

    lerParticipantes((participantes) => {
        const index = participantes.findIndex(p => p.id === id);

        if (index === -1) {
            return res.status(404).json({ mensagem: 'Participante não encontrado!' });
        }
        const camposAtualizaveis = { nome, email, senha, idade, cidade }
        for (const campo in camposAtualizaveis) {
            if (camposAtualizaveis[campo] !== undefined) {
                participantes[index][campo] = camposAtualizaveis[campo];
            }
        }

        salvarParticipantes(participantes, (err) => {
            if (err) {
                return res.status(500).json({ mensagem: 'Erro ao salvar alterações!' });
            }

            res.status(200).json({ mensagem: 'Participante atualizado com sucesso!', participante: participantes[index] });
        });
    });
});
app.delete('/participantes/:id', (req, res) => {
    const id = Number(req.params.id);

    lerParticipantes((participantes) => {
        const index = participantes.findIndex(p => p.id === id);

        if (index === -1) {
            return res.status(400).json({ mensagem: 'Pessoa não encontrada!' });
        }

        participantes.splice(index, 1);

        salvarParticipantes(participantes, (err) => {
            if (err) {
                return res.status(500).json({ mensagem: 'Erro ao salvar alterações' });
            }

            res.status(200).json({ mensagem: 'Pessoa excluída com sucesso!' });
        })
    })
})

app.get('/participantes/city/most', (req, res) => {
    lerParticipantes((participantes) => {
        const cidades = {};

        participantes.forEach(p => {
            if (p.cidade) {
                cidades[p.cidade] = (cidades[p.cidade] || 0) + 1;
            }
        });

        const cidadeMaisComum = Object.entries(cidades).reduce((a, b) => b[1] > a[1] ? b : a, ['', 0]);

        res.status(200).json({
            cidade: cidadeMaisComum[0],
            quantidade: cidadeMaisComum[1]
        });
    })
})

app.listen(PORT, () => {
    console.log('Servidor iniciado com sucesso, na porta: 3333')
})
