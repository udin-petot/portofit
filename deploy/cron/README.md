# Scheduled jobs

PortoFit does not run its billing sweep inside the app process. The Docker host calls four
authenticated endpoints every minute or every fifteen minutes. If those crontab entries are
missing, orders never expire, invoice emails never leave the queue, and admin alerts stop.

## Install

1. Copy `portofit-cron.sh` to `/home/ubuntu/portofit/` and make it executable.
2. Make sure `/home/ubuntu/portofit/.env` contains `CRON_SECRET`, the same value the app uses.
   The endpoints answer 404 when it is unset.
3. Install the lines from `crontab.example` with `crontab -e`.

| Job | Path | Schedule | What stops if it is missing |
|---|---|---|---|
| `order-expiry` | `/api/cron/order-expiry` | every minute | Expired orders keep the "continue payment" strip alive |
| `invoice-mailer` | `/api/cron/invoice-mailer` | every minute | Paid orders never email their receipt |
| `admin-alerts` | `/api/cron/admin-alerts` | every minute | The admin never hears that a proof is waiting |
| `career` | `/api/career/run` | every 15 minutes | Scheduled job searches and reminders stop |

The app also serves its own trash retention timer. That is not a cron job.

## Test one job

```sh
/home/ubuntu/portofit/portofit-cron.sh order-expiry
```

A successful tick is silent and exits 0. A missing secret exits 2 before any request.
