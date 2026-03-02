const { execSync } = require('child_process');
const fs = require('fs');

function run(cmd) {
    try {
        console.log(`\n> ${cmd}`);
        const out = execSync(cmd, { stdio: 'pipe' });
        const output = out.toString();
        console.log(output);
        return output;
    } catch (e) {
        const err = e.stdout ? e.stdout.toString() : e.message;
        console.log(err);
        return err;
    }
}

let log = '';
const originalConsoleLog = console.log;
console.log = (...args) => {
    const line = args.join(' ') + '\n';
    log += line;
    originalConsoleLog(...args);
};

run('git add .');
run('git commit -m "feat: Migrate to Groq Llama 4 Vision & UI Improvements"');
run('git branch -M main');
// Check if remote exists
const remotes = run('git remote -v');
// Assume git remote is configured, but just push
run('git push -u origin main');
run('npx --yes vercel --prod --yes');

fs.writeFileSync('deploy.log', log);
