from datetime import timedelta


def upload_to_bucket(bucket, file_bytes, destination_path, content_type):
    blob = bucket.blob(destination_path)
    blob.upload_from_string(file_bytes, content_type=content_type)

    return blob.generate_signed_url(
        version="v4",
        expiration=timedelta(days=7),
        method="GET"
    )
