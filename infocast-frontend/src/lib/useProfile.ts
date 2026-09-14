// 학년별 화면 분기를 위한 프로파일 훅. 학년/교육과정만 받는다(민감 필드 없음).
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { useAuth } from '../store/auth';

/** 1·2·3 = 고1~고3, 'N' = 재수생/졸업생. null = 미상(Hub 미가용 등). */
export type Grade = 1 | 2 | 3 | 'N' | null;

export interface MyProfile {
  grade: Grade;
  curriculum: string | null;
}

/** 올해 대입에 실제로 지원하는 집단 — 실행 모드 화면. */
export function isApplicant(grade: Grade): boolean {
  return grade === 3 || grade === 'N';
}

/** 아직 준비 단계인 집단 — 준비 모드 화면. */
export function isUnderclassman(grade: Grade): boolean {
  return grade === 1 || grade === 2;
}

export function gradeLabel(grade: Grade): string {
  if (grade === 'N') return '재수생';
  if (grade === null) return '';
  return `고${grade}`;
}

export function useProfile() {
  const { token } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const res = await api.get('/profile/me');
      return (res.data?.data ?? res.data) as MyProfile;
    },
    enabled: !!token,
    staleTime: 30 * 60 * 1000, // 학년은 학기 중에 바뀌지 않는다.
    retry: false,
  });

  return { grade: (data?.grade ?? null) as Grade, curriculum: data?.curriculum ?? null, isLoading };
}
