# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Code Review Bot - A GitHub PR automation bot that integrates AI-powered code analysis.

## Tech Stack

- **Runtime**: Node.js
- **APIs**: GitHub API, Claude API
- **CI/CD**: GitHub Actions

## Planned Features

1. Automatic code quality analysis on PR submission
2. Code standards checking, bug detection, performance issue identification
3. Specific optimization suggestions with code examples
4. Automatic severity labeling (P0/P1/P2)
5. Custom review rules via Skill configuration

## Architecture Notes

This bot will run as a GitHub Actions workflow triggered by PR events. It should:
- Fetch PR diff via GitHub API
- Send code changes to Claude API for analysis
- Post review comments back to the PR with severity labels
