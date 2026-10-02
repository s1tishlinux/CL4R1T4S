import os
import time
import logging
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from rag_pipeline_manager import RAGPipelineManager
from rag_preprocessor import RAGPreprocessor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)

BASE_DIR = Path(__file__).parent.parent.parent / "books"
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

class UploadHandler(FileSystemEventHandler):
    def __init__(self, manager):
        self.manager = manager
        
    def process(self, event):
        if event.is_directory:
            return
            
        filepath = Path(event.src_path)
        if filepath.suffix.lower() not in ['.pdf', '.md', '.txt']:
            return
            
        # Give file time to finish copying
        time.sleep(2)
        
        logging.info(f"New file detected: {filepath.name}")
        try:
            role = RAGPreprocessor.classify_role(filepath.name, "")
            res = self.manager.run_automated_pipeline(
                file_path=str(filepath),
                filename=filepath.name,
                role="auto",
                chunk_size=1000,
                chunk_overlap=150,
                force=False
            )
            if res.get("success"):
                logging.info(f"Successfully auto-ingested {filepath.name} into {res.get('role')} database. Status: {res.get('status')}")
            else:
                logging.error(f"Failed to auto-ingest {filepath.name}: {res.get('error')}")
        except Exception as e:
            logging.error(f"Error processing {filepath.name}: {e}")

    def on_created(self, event):
        self.process(event)
        
    def on_modified(self, event):
        self.process(event)

def run_watchdog():
    logging.info(f"Starting RAG Auto-Ingestion Watchdog on {UPLOADS_DIR}...")
    manager = RAGPipelineManager(base_path=str(BASE_DIR))
    
    event_handler = UploadHandler(manager)
    observer = Observer()
    observer.schedule(event_handler, str(UPLOADS_DIR), recursive=False)
    
    try:
        observer.start()
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

if __name__ == "__main__":
    run_watchdog()
