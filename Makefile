SERVER=34.170.73.161

deploy:
	./deploy.sh ${SERVER}

restart:
	ssh sistemas@${SERVER} pm2 restart all

stop:
	ssh sistemas@${SERVER} pm2 stop all