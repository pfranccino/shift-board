import os
import firebase_admin
from firebase_admin import credentials, firestore

_db = None

def get_db():
    global _db
    if _db is None:
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        _db = firestore.client()
    return _db

def get_job(org_id: str, job_id: str) -> dict:
    db = get_db()
    doc = db.collection('organizations').document(org_id).collection('jobs').document(job_id).get()
    if not doc.exists:
        raise ValueError(f"Job {job_id} not found")
    return doc.to_dict()

def update_job(org_id: str, job_id: str, data: dict):
    db = get_db()
    db.collection('organizations').document(org_id).collection('jobs').document(job_id).update(data)
