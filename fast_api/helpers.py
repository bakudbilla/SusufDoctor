from google.cloud import firestore

async def generate_patient_id(db: firestore.Client) -> str:
    """Generate a custom patient ID in format: PatientID1, PatientID2, etc."""
    counter_ref = db.collection("counters").document("patient_counter")
    
    # Get the current counter value
    counter_doc = counter_ref.get()
    
    if not counter_doc.exists:
        # Initialize counter if it doesn't exist
        counter_ref.set({"current_id": 1})
        next_id = 1
    else:
        # Increment the counter atomically
        next_id = counter_doc.get("current_id") + 1
        counter_ref.update({"current_id": next_id})
    
    return f"PatientID{next_id}"
