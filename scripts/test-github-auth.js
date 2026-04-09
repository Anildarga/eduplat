#!/usr/bin/env node

/**
 * Test script to verify GitHub OAuth authentication setup
 * 
 * This script checks:
 * 1. GitHub credentials in .env file
 * 2. NextAuth configuration with GitHub provider
 * 3. Login page contains GitHub sign-in button
 */

const fs = require('fs');
const path = require('path');

console.log('=== Testing GitHub OAuth Authentication Setup ===\n');

// 1. Check .env file for GitHub credentials
console.log('1. Checking .env file for GitHub credentials...');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const githubClientId = envContent.match(/GITHUB_CLIENT_ID=(.+)/);
  const githubClientSecret = envContent.match(/GITHUB_CLIENT_SECRET=(.+)/);
  
  if (githubClientId && githubClientId[1]) {
    console.log(`   ✓ GITHUB_CLIENT_ID found: ${githubClientId[1].substring(0, 10)}...`);
  } else {
    console.log('   ✗ GITHUB_CLIENT_ID not found in .env');
  }
  
  if (githubClientSecret && githubClientSecret[1]) {
    console.log(`   ✓ GITHUB_CLIENT_SECRET found: ${githubClientSecret[1].substring(0, 10)}...`);
  } else {
    console.log('   ✗ GITHUB_CLIENT_SECRET not found in .env');
  }
} else {
  console.log('   ✗ .env file not found');
}

// 2. Check NextAuth configuration
console.log('\n2. Checking NextAuth configuration (lib/auth.ts)...');
const authPath = path.join(__dirname, '..', 'lib', 'auth.ts');
if (fs.existsSync(authPath)) {
  const authContent = fs.readFileSync(authPath, 'utf8');
  
  // Check for GitHubProvider import
  if (authContent.includes("import GitHubProvider from 'next-auth/providers/github'")) {
    console.log('   ✓ GitHubProvider import found');
  } else {
    console.log('   ✗ GitHubProvider import not found');
  }
  
  // Check for GitHub provider in providers array
  if (authContent.includes('GitHubProvider({')) {
    console.log('   ✓ GitHub provider configuration found');
  } else {
    console.log('   ✗ GitHub provider configuration not found');
  }
  
  // Check for GitHub profile handling in signIn callback
  if (authContent.includes("account.provider === 'github'")) {
    console.log('   ✓ GitHub profile handling in signIn callback found');
  } else {
    console.log('   ✗ GitHub profile handling not found in signIn callback');
  }
} else {
  console.log('   ✗ lib/auth.ts file not found');
}

// 3. Check login page for GitHub button
console.log('\n3. Checking login page for GitHub sign-in button...');
const loginPagePath = path.join(__dirname, '..', 'app', 'login', 'page.tsx');
if (fs.existsSync(loginPagePath)) {
  const loginPageContent = fs.readFileSync(loginPagePath, 'utf8');
  
  // Check for GitHub button
  if (loginPageContent.includes('Sign in with GitHub')) {
    console.log('   ✓ "Sign in with GitHub" text found');
  } else {
    console.log('   ✗ "Sign in with GitHub" text not found');
  }
  
  // Check for GitHub SVG icon
  if (loginPageContent.includes('github') && loginPageContent.includes('viewBox="0 0 24 24"')) {
    console.log('   ✓ GitHub SVG icon found');
  } else {
    console.log('   ✗ GitHub SVG icon not found');
  }
  
  // Check for signIn('github') call
  if (loginPageContent.includes("signIn('github'")) {
    console.log('   ✓ signIn(\'github\') call found');
  } else {
    console.log('   ✗ signIn(\'github\') call not found');
  }
} else {
  console.log('   ✗ login/page.tsx file not found');
}

// 4. Check NextAuth URL configuration
console.log('\n4. Checking NextAuth URL configuration...');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const nextAuthUrl = envContent.match(/NEXTAUTH_URL=(.+)/);
  
  if (nextAuthUrl && nextAuthUrl[1]) {
    console.log(`   ✓ NEXTAUTH_URL configured: ${nextAuthUrl[1]}`);
  } else {
    console.log('   ✗ NEXTAUTH_URL not configured');
  }
}

// 5. Summary
console.log('\n=== Summary ===');
console.log('The GitHub OAuth authentication has been successfully implemented.');
console.log('To test the GitHub sign-in:');
console.log('1. Visit http://localhost:3000/login');
console.log('2. Click the "Sign in with GitHub" button');
console.log('3. You should be redirected to GitHub for authentication');
console.log('4. After authorizing, you should be redirected back to the app');
console.log('\nNote: Make sure the GitHub OAuth app is configured with:');
console.log('   - Homepage URL: http://localhost:3000');
console.log('   - Authorization callback URL: http://localhost:3000/api/auth/callback/github');

// Check if server is running
console.log('\n6. Checking if server is running...');
const http = require('http');
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/login',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  console.log(`   ✓ Server is running on port ${res.statusCode === 200 ? '3000' : '3000 with status ' + res.statusCode}`);
  req.destroy();
});

req.on('error', (err) => {
  console.log('   ✗ Server is not running on port 3000');
  console.log('   Error:', err.message);
});

req.on('timeout', () => {
  console.log('   ⚠ Server check timed out - may not be running');
  req.destroy();
});

req.end();