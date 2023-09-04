import time
import uvicorn
from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse
from starlette.staticfiles import StaticFiles

import models
from database import engine, SessionLocal
from video_editor import (
    show_sub_videos,
    generate_images,
    edit_image,
    merge_video,
    get_sub_video_info,
    edit_audio,
)

from video_maker import make_video, get_tts_infos


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


origins = ["http://localhost:3000", "http://localhost:3000/"]

models.Base.metadata.create_all(bind=engine)


app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MakeVideoRequest(BaseModel):
    keyword: str
    tts_id: int


class ChangeImageRequest(BaseModel):
    uuid: str
    index: int
    url: str


class ChangeTTSRequest(BaseModel):
    uuid: str
    index: int
    tts_id: str


class MergeVideoRequest(BaseModel):
    uuid: str


@app.post("/change-image")
def edit_images(body: ChangeImageRequest, db: Session = Depends(get_db)):
    return edit_image(body.uuid, body.index, body.url, db)


@app.post("/change-tts")
def edit_tts(body: ChangeTTSRequest, db: Session = Depends(get_db)):
    return edit_audio(body.uuid, body.index, body.tts_id, db)


@app.post("/make")
def post_video(body: MakeVideoRequest, db: Session = Depends(get_db)):
    start_time = time.time()
    result = make_video(body.keyword, body.tts_id, db)
    end_time = time.time()
    print(f"processing time: {end_time - start_time}seconds")
    return result


@app.get("/editor")
def video_editor(uuid: str, db: Session = Depends(get_db)):
    return show_sub_videos(uuid, db)


@app.get("/subvideo-info")
def get_image_keyword(uuid: str, index: int, db: Session = Depends(get_db)):
    return get_sub_video_info(uuid, index, db)


@app.get("/tts-info")
def get_tts_info(db: Session = Depends(get_db)):
    return get_tts_infos(db)


@app.get("/generate-images")
def generate_image(keyword: str, n: int = 3, size: str = "256x256"):
    return generate_images(keyword, n, size)


@app.post("/merge-videos")
def merge_videos(body: MergeVideoRequest, db: Session = Depends(get_db)):
    merge_video(body.uuid, db)

    return RedirectResponse(f"/editor/{body.uuid}")


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
