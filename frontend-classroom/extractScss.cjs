const fs = require('fs');
const path = require('path');

const stylePath = path.join(__dirname, 'src/pages/Teacher/ClassroomDetail/TeacherClassroomDetail.module.scss');
const outDir = path.join(__dirname, 'src/components/ui/QuizBuilder');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outScss = path.join(outDir, 'QuizBuilder.module.scss');

const scssContent = fs.readFileSync(stylePath, 'utf8');
const linesScss = scssContent.split('\n');

let scssStart = linesScss.findIndex(l => l.includes('/* FORM CREATE QUIZ VIEW */'));
let scssEnd = linesScss.findIndex(l => l.includes('/* ========================================================================='));
let extractedScss = linesScss.slice(scssStart, scssEnd).join('\n');
fs.writeFileSync(outScss, extractedScss);
console.log("Successfully extracted SCSS");
