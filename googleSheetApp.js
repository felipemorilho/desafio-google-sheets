const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline');
const { promisify } = require('util');
const { googleAuth, sheets } = require('./auth');


const SPREADSHEET_ID = '114CW9JMd-BG30lBTRX0snC2TfwFjH-NMRCbjZ1f31Mg';
const RANGE = 'A4:H27'; // Assuming data is present from row 4 to row 27


function calculateSituation(average, absences) {

    if (absences > 0.25 * 60) {

        return 'Reprovado por Falta';

    } else if (average < 50) {

        return 'Reprovado por Nota';

    } else if (average >= 70) {

        return 'Aprovado';

    } else {

        return 'Exame Final';

    }
}

function calculateNaf(average) {

    return Math.ceil(100 - average);

}

async function updateSpreadsheet(auth) {

    const sheetsApi = google.sheets({ version: 'v4', auth });

    try {

        const response = await sheetsApi.spreadsheets.values.get({

            spreadsheetId: SPREADSHEET_ID,
            range: RANGE,

        });

        const rows = response.data.values;

        if (rows.length) {

            for (let i = 0; i < rows.length; i++) {

                const [matricula, aluno, faltas, p1, p2, p3, situacao, naf] = rows[i];

                const average = (parseFloat(p1) + parseFloat(p2) + parseFloat(p3)) / 3;
                const absences = parseFloat(faltas);

                const newSituation = calculateSituation(average, absences);
                const newNaf = newSituation === 'Exame Final' ? calculateNaf(average) : 0;

                const updateResponse = await sheetsApi.spreadsheets.values.update({

                    spreadsheetId: SPREADSHEET_ID,
                    range: `G${i + 4}:H${i + 4}`,
                    valueInputOption: 'RAW',
                    resource: {
                        values: [[newSituation, newNaf]],

                    },
                });

                console.log(`Linha ${i + 4} Atualizada:`, updateResponse.data);

            }
        } else {

            console.log('Nenhum dado foi encontrado.');

        }
    } catch (error) {

        console.error('Erro ao atualizar a planilha: ', error);

    }
}

fs.readFile('credentials.json', 'utf8', async (err, content) => {

    if (err) return console.error('Erro ao carregar o client_secret: ', err);

    const credentials = JSON.parse(content);
    const auth = await googleAuth.authorize(credentials);

    updateSpreadsheet(auth);

});
