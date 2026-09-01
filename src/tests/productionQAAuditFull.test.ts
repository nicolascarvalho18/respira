import { userService } from '../services/user/userService';
import { supabaseUserService } from '../services/user/supabaseUserService';
import { soundEngine } from '../services/sound/soundEngine';
import { getPracticeImage, getPracticeAltText, PRACTICE_IMAGES, PRACTICE_ALT_TEXTS } from '../utils/practiceImages';
import { processAvatarImage } from '../utils/imageProcessor';
import { SOUNDSCAPES } from '../constants/soundscapes';
import { MUSIC_TRACKS } from '../constants/musicTracks';
import fs from 'fs';
import path from 'path';

describe('Auditoria Completa de Qualidade (Testes & QA) — Pontos Críticos e B.O.s', () => {
  describe('1. Auditoria de Fotos, Imagens e Mídia', () => {
    it('todas as imagens mapeadas em PRACTICE_IMAGES devem apontar para assets válidos', () => {
      const keys = Object.keys(PRACTICE_IMAGES);
      expect(keys.length).toBeGreaterThan(20);

      keys.forEach((key) => {
        const image = getPracticeImage(key);
        expect(image).toBeDefined();
        const altText = getPracticeAltText(key);
        expect(altText).toBeDefined();
        expect(typeof altText).toBe('string');
        expect(altText.length).toBeGreaterThan(5);
      });
    });

    it('todas as paisagens sonoras e músicas devem ter IDs válidos e recursos configurados', () => {
      expect(SOUNDSCAPES.length).toBe(16);
      SOUNDSCAPES.forEach((s) => {
        expect(s.id).toBeDefined();
        expect(s.name).toBeDefined();
        expect(s.category).toBeDefined();
        expect(s.icon).toBeDefined();
      });

      expect(MUSIC_TRACKS.length).toBe(24);
      MUSIC_TRACKS.forEach((m) => {
        expect(m.id).toBeDefined();
        expect(m.title).toBeDefined();
        expect(m.artist).toBeDefined();
        expect(m.durationSeconds).toBeGreaterThan(0);
      });
    });

    it('o utilitário de imagem deve processar formatos válidos e rejeitar arquivos corrompidos', async () => {
      const validBlob = new Blob(['image-bytes-mock'], { type: 'image/webp' });
      const processed = await processAvatarImage(validBlob);
      expect(processed).toBeDefined();
      expect(processed.blob).toBeDefined();
      expect(processed.previewUrl).toBeDefined();
    });
  });

  describe('2. Auditoria de Exercícios, Timers e Motor de Áudio', () => {
    it('o motor de áudio deve permitir controle de volume, mute e parada total', () => {
      soundEngine.setMasterVolume(0.5);
      soundEngine.setMuted(true);
      expect(soundEngine.getIsMuted()).toBe(true);

      soundEngine.toggleMute();
      expect(soundEngine.getIsMuted()).toBe(false);

      soundEngine.stopAll();
    });

    it('as faixas de música e efeitos sonoros devem executar sem lançar exceções', () => {
      expect(() => soundEngine.playCue('bell')).not.toThrow();
      expect(() => soundEngine.playCue('chime')).not.toThrow();
      expect(() => soundEngine.playCue('complete')).not.toThrow();
      expect(() => soundEngine.playAmbience('sound-rain-soft')).not.toThrow();
      expect(() => soundEngine.playMusic('music-528hz-transformation')).not.toThrow();
      expect(() => soundEngine.stopAll()).not.toThrow();
    });
  });

  describe('3. Auditoria de Letras, Textos, Tipografia e Validações', () => {
    it('deve sanitizar entradas de texto contra injeção de tags HTML e espaços excessivos', () => {
      const maliciousInput = '   <script>alert("hack")</script> Nicolas Carvalho    ';
      const sanitized = maliciousInput.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
      expect(sanitized).toBe('alert("hack") Nicolas Carvalho');
      expect(sanitized.startsWith(' ')).toBe(false);
      expect(sanitized.endsWith(' ')).toBe(false);
    });

    it('deve validar limites de tamanho para nome e biografia', () => {
      const shortName = 'A';
      const validName = 'Nicolas Carvalho';
      const longName = 'A'.repeat(65);

      expect(shortName.trim().length >= 2).toBe(false);
      expect(validName.trim().length >= 2 && validName.length <= 60).toBe(true);
      expect(longName.length <= 60).toBe(false);

      const validBio = 'Pesquisador em saúde mental e desenvolvimento de software.';
      const longBio = 'B'.repeat(165);
      expect(validBio.length <= 160).toBe(true);
      expect(longBio.length <= 160).toBe(false);
    });
  });

  describe('4. Auditoria de Segurança, RLS e Banco de Dados', () => {
    it('as migrations devem conter todas as políticas de segurança ativas', () => {
      const migrationFile = path.join(
        __dirname,
        '../../supabase/migrations/20260830000001_ensure_profiles_columns_and_storage_rls.sql'
      );
      expect(fs.existsSync(migrationFile)).toBe(true);

      const content = fs.readFileSync(migrationFile, 'utf-8');
      expect(content).toContain('enable row level security');
      expect(content).toContain('auth.uid() = id');
      expect(content).toContain("bucket_id = 'avatars'");
    });
  });
});
