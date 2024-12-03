#!/bin/bash
file=seace
user=user
server=$1
rm -R dist
npm run build
tar -cf ../$file.tar.xz --exclude='node_modules' --exclude='src' --exclude='package-lock.json' ../$file
scp ../$file.tar.xz $user@$server:
ssh $user@$server sudo rm -R $file
ssh $user@$server tar -xf $file.tar.xz
ssh $user@$server npm install --production --prefix /home/$user/seace
ssh $user@$server pm2 restart all