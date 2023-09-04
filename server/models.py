from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from database import Base


class Video(Base):
    __tablename__ = "videos"

    id = Column(String(40), primary_key=True, index=True)
    keyword = Column(Text)
    script = Column(Text)
    sub_videos = relationship("SubVideo", back_populates="full_video")


class SubVideo(Base):
    __tablename__ = "sub_videos"

    id = Column(Integer, primary_key=True, index=True)
    index = Column(Integer)
    keyword = Column(Text)
    script = Column(Text)
    full_video_id = Column(String(40), ForeignKey("videos.id"), index=True)
    full_video = relationship("Video", back_populates="sub_videos")
    tts_id = Column(Integer, ForeignKey('tts_info.id'))
    tts = relationship("TTSInfo")


class TTSInfo(Base):
    __tablename__ = "tts_info"

    id = Column(Integer, primary_key=True, index=True)
    api = Column(String(20))
    voice_code = Column(String(20))
    text = Column(String(20))
