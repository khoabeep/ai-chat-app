const { execSync } = require('child_process');
const fs = require('fs');

function run(cmd) {
    try {
        const out = execSync(cmd, { stdio: 'pipe' });
        const output = out.toString();
        return output;
    } catch (e) {
        return e.stdout ? e.stdout.toString() : e.message;
    }
}

let log = '';
log += run('git add .') + '\n';
log += run('git commit -m "feat: Migrate to Groq Llama 4 Vision & UI Improvements"') + '\n';
log += run('git branch -M main') + '\n';
log += run('git push -u origin main') + '\n';

fs.writeFileSync('git_push_log.txt', log);
console.log('Done git push');
