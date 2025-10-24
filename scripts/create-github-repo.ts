import { Octokit } from '@octokit/rest';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

async function createRepository() {
  try {
    const octokit = await getGitHubClient();
    
    // Get the authenticated user
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`✓ Authenticated as: ${user.login}`);
    
    // Create the repository
    const repoName = 'l5x-file-parser';
    const { data: repo } = await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      description: 'A professional engineering tool for parsing and viewing RSLogix 5000 L5X (Logix 5000 XML) control files with AI-powered ladder logic editing',
      private: false,
      auto_init: false,
    });
    
    console.log(`\n✅ Repository created successfully!`);
    console.log(`\nRepository Details:`);
    console.log(`  Name: ${repo.name}`);
    console.log(`  URL: ${repo.html_url}`);
    console.log(`  Clone URL (HTTPS): ${repo.clone_url}`);
    console.log(`  Clone URL (SSH): ${repo.ssh_url}`);
    
    console.log(`\n📋 Next Steps:`);
    console.log(`\n1. Open the Shell in Replit`);
    console.log(`2. Run these commands:\n`);
    console.log(`   git remote add origin ${repo.clone_url}`);
    console.log(`   git branch -M main`);
    console.log(`   git push -u origin main`);
    console.log(`\n3. Visit your repository: ${repo.html_url}`);
    
  } catch (error: any) {
    if (error.status === 422) {
      console.error(`\n❌ Repository 'l5x-file-parser' already exists in your GitHub account.`);
      console.log(`\nYou can either:`);
      console.log(`  1. Delete the existing repository and run this script again`);
      console.log(`  2. Use a different repository name by modifying this script`);
      console.log(`  3. Connect to the existing repository (see instructions below)`);
    } else {
      console.error('❌ Error creating repository:', error.message);
    }
    process.exit(1);
  }
}

createRepository();
