'use client';

import { useEffect, useRef, useState } from 'react';

interface CameraFeedProps {
  children?: React.ReactNode;
}

export function CameraFeed({ children }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError') {
            setError('카메라 사용 허가가 필요합니다.\n브라우저 설정에서 카메라 권한을 허용해 주세요.');
          } else if (err.name === 'NotFoundError') {
            setError('카메라를 찾을 수 없습니다.\n카메라가 연결되어 있는지 확인해 주세요.');
          } else {
            setError('카메라를 시작할 수 없습니다.\n잠시 후 다시 시도해 주세요.');
          }
        }
      }
    }

    startCamera();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-2xl p-8">
        <p className="text-white text-2xl text-center whitespace-pre-line leading-relaxed">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover scale-x-[-1]"
      />
      {children}
    </div>
  );
}
