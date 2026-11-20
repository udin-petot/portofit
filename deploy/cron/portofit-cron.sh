#!/usr/bin/env bash
# One entry point for the scheduled PortoFit jobs. Install this file on the Docker host,
# next to docker-compose.yml, and let crontab call it with the job name.
set -euo pipefail

# The app's compose env file holds CRON_SECRET. Keep this file readable by the cron user only.
set -a
# shellcheck disable=SC1091
. /home/ubuntu/portofit/.env
set +a

: "${CRON_SECRET:?CRON_SECRET is not set in /home/ubuntu/portofit/.env}"

case "${1:-}" in
	order-expiry) path="/api/cron/order-expiry" ;;
	invoice-mailer) path="/api/cron/invoice-mailer" ;;
	admin-alerts) path="/api/cron/admin-alerts" ;;
	career) path="/api/career/run" ;;
	*)
		echo "usage: $0 order-expiry|invoice-mailer|admin-alerts|career" >&2
		exit 2
		;;
esac

# The app publishes 3000 on the host. Use 127.0.0.1 so the call never leaves the machine.
curl -fsS -X POST -H "Authorization: Bearer ${CRON_SECRET}" "http://127.0.0.1:3000${path}"
