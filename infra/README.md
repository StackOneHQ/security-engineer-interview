# infra

Terraform for the gateway's production database.

Local development uses SQLite (see the repo root), so you don't need this to run the app. In production the gateway runs against RDS Postgres, which is what `main.tf` provisions.

For the exercise this is review-only: read it the way you'd review an infra PR. You don't need an AWS account, and you should not run `terraform apply`.
