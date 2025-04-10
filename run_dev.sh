IP_ADDR=$(/sbin/ip addr show ens160 | awk -F"[ /]+" '/inet / {print $3}')
#echo $IP_ADDR

/usr/local/bin/hugo serve -D --bind $IP_ADDR --port 80
