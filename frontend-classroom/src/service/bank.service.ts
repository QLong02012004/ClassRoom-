import api from '../utils/AxiosCustomize';
import type { IBackendRes } from '../types/backend';

export interface IBankItem {
    _id: string;
    teacherId: string;
    type: 'quiz' | 'document';
    title: string;
    description: string;
    maxScore: number;
    subject?: string;
    sharingStatus?: 'CENTER_SHARED' | 'PRIVATE';
    quizQuestions?: any[];
    durationMinutes?: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    fileUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export const bankService = {
    getMyBankItems: async (): Promise<IBackendRes<IBankItem[]>> => {
        return await api.get('/api/v1/bank');
    },

    getBankItemById: async (id: string): Promise<IBackendRes<IBankItem>> => {
        return await api.get(`/api/v1/bank/${id}`);
    },

    createBankItem: async (data: Partial<IBankItem>): Promise<IBackendRes<IBankItem>> => {
        return await api.post('/api/v1/bank', data);
    },

    updateBankItem: async (id: string, data: Partial<IBankItem>): Promise<IBackendRes<IBankItem>> => {
        return await api.put(`/api/v1/bank/${id}`, data);
    },

    deleteBankItem: async (id: string): Promise<IBackendRes<null>> => {
        return await api.delete(`/api/v1/bank/${id}`);
    }
};
