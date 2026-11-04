#!/usr/bin/env python3
"""
Database Management & Sync Tool for Dr. Prithish Halder's Website
Handles adding, listing, importing, exporting, and syncing publications to Docusaurus.
"""

import sqlite3
import json
import csv
import os
import sys
import re
import argparse

DB_PATH = os.path.join(os.path.dirname(__file__), 'publications.db')
BIB_PATH = os.path.join(os.path.dirname(__file__), 'publications.bib')
EXPORT_JSON_PATH = os.path.join(
    os.path.dirname(__file__), '..', 'website-docusaurus', 'src', 'data', 'publications.json'
)
PRESENTATIONS_JSON_PATH = os.path.join(
    os.path.dirname(__file__), '..', 'website-docusaurus', 'src', 'data', 'presentations.json'
)

def get_connection():
    return sqlite3.connect(DB_PATH)

def init_db():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute('''
    CREATE TABLE IF NOT EXISTS publications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cite_key TEXT UNIQUE,
        title TEXT NOT NULL,
        authors TEXT NOT NULL,
        journal TEXT,
        year INTEGER,
        details TEXT,
        impact_factor REAL DEFAULT 0,
        sjr REAL DEFAULT 0,
        quartile TEXT,
        citations INTEGER DEFAULT 0,
        pub_type TEXT DEFAULT 'Article',
        doi TEXT,
        pdf_url TEXT,
        abstract TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')
    cur.execute('''
    CREATE TABLE IF NOT EXISTS presentations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year TEXT NOT NULL,
        title TEXT NOT NULL,
        venue TEXT NOT NULL,
        talk_type TEXT DEFAULT 'Contributed Talk',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')
    cur.execute('''
    CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')
    conn.commit()
    conn.close()

def sync_to_website():
    """Sync SQLite database to the website's JSON data bundle and a BibTeX archive file."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    # 1. Sync Publications
    cur.execute('SELECT * FROM publications ORDER BY year DESC, id DESC')
    rows = cur.fetchall()

    pubs_list = []
    bib_entries = []

    for r in rows:
        d = dict(r)
        mapped = {
            'id': d['id'],
            'cite_key': d['cite_key'],
            'title': d['title'],
            'authors': d['authors'],
            'journal': d['journal'] or '',
            'year': d['year'] or 0,
            'details': d['details'] or '',
            'iff': d['impact_factor'] or 0.0,
            'sjr': d['sjr'] or 0.0,
            'qStr': d['quartile'] or '',
            'citations': d['citations'] or 0,
            'type': d['pub_type'] or 'Article',
            'doi': d['doi'] or '',
            'pdf_url': d['pdf_url'] or '',
            'abstract': d['abstract'] or ''
        }
        pubs_list.append(mapped)

        entry_type = 'article' if d['pub_type'] == 'Article' else 'inproceedings'
        key = d['cite_key'] or f"pub_{d['id']}"
        bib = f"@{entry_type}{{{key},\n"
        bib += f"  title = {{{d['title']}}},\n"
        bib += f"  author = {{{d['authors']}}},\n"
        if d['journal']:
            bib += f"  journal = {{{d['journal']}}},\n"
        if d['year']:
            bib += f"  year = {{{d['year']}}},\n"
        if d['doi']:
            bib += f"  doi = {{{d['doi']}}},\n"
        bib += "}\n"
        bib_entries.append(bib)

    # 2. Sync Presentations
    cur.execute('SELECT * FROM presentations ORDER BY year DESC, id DESC')
    pres_rows = cur.fetchall()
    pres_list = [dict(pr) for pr in pres_rows]

    conn.close()

    os.makedirs(os.path.dirname(EXPORT_JSON_PATH), exist_ok=True)
    with open(EXPORT_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(pubs_list, f, indent=2, ensure_ascii=False)

    with open(PRESENTATIONS_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(pres_list, f, indent=2, ensure_ascii=False)

    with open(BIB_PATH, 'w', encoding='utf-8') as f:
        f.write("\n".join(bib_entries))

    print(f"✔ Successfully synced {len(pubs_list)} publications and {len(pres_list)} presentations to website")
    print(f"✔ Updated BibTeX database at: {BIB_PATH}")

def list_publications():
    """List all publications in the database."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute('SELECT id, year, title, journal, citations, quartile, impact_factor FROM publications ORDER BY year DESC, id DESC')
    rows = cur.fetchall()
    print(f"\nFound {len(rows)} publications:")
    print("-" * 80)
    for r in rows:
        q = f"[{r['quartile']}]" if r['quartile'] else ""
        c = f"[Cites: {r['citations']}]" if r['citations'] else ""
        print(f"[{r['id']}] {r['year'] or '----'} | {r['title'][:55]}... | {r['journal']} {q} {c}")
    print("-" * 80)
    conn.close()

def add_publication(title, authors, journal, year=None, details="", iff=0.0, sjr=0.0, quartile="", citations=0, pub_type="Article", doi=""):
    """Insert a new publication and automatically sync."""
    conn = get_connection()
    cur = conn.cursor()
    
    first_author = authors.split(',')[0].replace('P. ', '').replace(' ', '')
    title_word = re.sub(r'[^a-zA-Z]', '', title.split()[0] if title.split() else 'Pub')
    cite_key = f"{first_author}{year or 2026}{title_word}"

    cur.execute('''
    INSERT INTO publications 
    (cite_key, title, authors, journal, year, details, impact_factor, sjr, quartile, citations, pub_type, doi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (cite_key, title, authors, journal, year, details, iff, sjr, quartile, citations, pub_type, doi))
    
    conn.commit()
    conn.close()
    print(f"✔ Added: '{title}' ({year})")
    sync_to_website()

def main():
    parser = argparse.ArgumentParser(description="Manage Dr. Prithish Halder's Publications Database")
    subparsers = parser.add_subparsers(dest="command")

    # Sync
    subparsers.add_parser("sync", help="Sync database directly into Docusaurus and BibTeX")

    # List
    subparsers.add_parser("list", help="List all publications in the database")

    # Add
    add_parser = subparsers.add_parser("add", help="Add a new publication")
    add_parser.add_argument("--title", required=True, help="Publication Title")
    add_parser.add_argument("--authors", required=True, help="Authors string (e.g., 'P. Halder, A. B. Smith')")
    add_parser.add_argument("--journal", required=True, help="Journal or Conference name")
    add_parser.add_argument("--year", type=int, help="Publication Year")
    add_parser.add_argument("--details", default="", help="Volume, Issue, Pages")
    add_parser.add_argument("--if", dest="iff", type=float, default=0.0, help="Impact Factor")
    add_parser.add_argument("--sjr", type=float, default=0.0, help="SJR score")
    add_parser.add_argument("--quartile", default="", help="Quartile (e.g. Q1, Q2)")
    add_parser.add_argument("--citations", type=int, default=0, help="Citation count")
    add_parser.add_argument("--type", default="Article", choices=["Article", "Proceeding"], help="Article or Proceeding")
    add_parser.add_argument("--doi", default="", help="DOI string (without https://doi.org/)")

    args = parser.parse_args()

    init_db()

    if args.command == "sync":
        sync_to_website()
    elif args.command == "list":
        list_publications()
    elif args.command == "add":
        add_publication(
            title=args.title,
            authors=args.authors,
            journal=args.journal,
            year=args.year,
            details=args.details,
            iff=args.iff,
            sjr=args.sjr,
            quartile=args.quartile,
            citations=args.citations,
            pub_type=args.type,
            doi=args.doi
        )
    else:
        # Default behavior: run sync
        sync_to_website()

if __name__ == '__main__':
    main()

