#!/usr/bin/env node
import { generateKeyPairSync } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const { publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  }
});

writeFileSync('build/update-bundle-public.pem', publicKey);
console.log('Generated test public key: build/update-bundle-public.pem');
