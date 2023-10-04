FROM httpd:latest

COPY ./ssl /ssl

RUN openssl req -x509 -sha256 -days 3650 -newkey rsa:2048 -config /ssl/ca.cnf -keyout /ssl/ca.key -out /ssl/ca.crt

RUN openssl genrsa -out /ssl/server.key 2048

RUN openssl req -new -key /ssl/server.key -out /ssl/server.csr -config /ssl/server.cnf

RUN openssl x509 -req -days 365 -in /ssl/server.csr -CA /ssl/ca.crt -CAkey /ssl/ca.key -CAcreateserial -out /ssl/server.crt -extensions req_extensions -extfile /ssl/server.cnf -sha256
