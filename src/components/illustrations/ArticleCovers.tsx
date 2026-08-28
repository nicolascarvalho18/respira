import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Svg, {
  Rect,
  Circle,
  Path,
  G,
  Defs,
  LinearGradient,
  Stop,
  ClipPath,
  Mask,
  Text as SvgText,
} from 'react-native-svg';

const EDITORIAL_IMAGE_COVERS: Record<string, any> = {
  'o-que-e-ansiedade-e-como-ela-funciona': require('../../../assets/images/o-que-e-ansiedade-e-como-ela-funciona.jpg'),
  'como-reconhecer-os-sinais-da-ansiedade': require('../../../assets/images/como-reconhecer-os-sinais-da-ansiedade.jpg'),
  'ansiedade-e-estresse-qual-e-a-diferenca': require('../../../assets/images/ansiedade-e-estresse-qual-e-a-diferenca.jpg'),
  'o-que-acontece-no-corpo-durante-uma-crise-de-ansiedade': require('../../../assets/images/o-que-acontece-no-corpo-durante-uma-crise-de-ansiedade.jpg'),
  'como-acalmar-os-pensamentos-acelerados': require('../../../assets/images/como-acalmar-os-pensamentos-acelerados.jpg'),
  'ansiedade-antes-de-provas-reunioes-e-apresentacoes': require('../../../assets/images/ansiedade-antes-de-provas-reunioes-e-apresentacoes.jpg'),
  'como-lidar-com-a-preocupacao-excessiva': require('../../../assets/images/como-lidar-com-a-preocupacao-excessiva.jpg'),
  'habitos-que-podem-aumentar-a-ansiedade': require('../../../assets/images/habitos-que-podem-aumentar-a-ansiedade.jpg'),
  'como-apoiar-alguem-que-esta-ansioso': require('../../../assets/images/como-apoiar-alguem-que-esta-ansioso.jpg'),
  'quando-procurar-ajuda-profissional': require('../../../assets/images/quando-procurar-ajuda-profissional.jpg'),
};

export interface ArticleCoverProps {
  slug: string;
  category?: string;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export const ArticleCoverImage: React.FC<ArticleCoverProps> = ({
  slug,
  category = '',
  width = '100%',
  height = 140,
  borderRadius = 12,
  style,
}) => {
  const normSlug = slug ? slug.toLowerCase().trim() : '';
  const normCat = category ? category.toLowerCase().trim() : '';

  if (EDITORIAL_IMAGE_COVERS[normSlug]) {
    return (
      <View
        style={[
          styles.container,
          {
            width,
            height,
            borderRadius,
          },
          style,
        ]}
      >
        <Image
          source={EDITORIAL_IMAGE_COVERS[normSlug]}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          accessibilityLabel={`Capa ilustrada para ${slug}`}
        />
      </View>
    );
  }

  // Determine category color themes
  const isAnxiety = normCat.includes('ansiedade') || normSlug.includes('ansiedade');
  const isSleep = normCat.includes('sono') || normSlug.includes('dormir') || normSlug.includes('sono');
  const isRegulation = normCat.includes('regulacao') || normSlug.includes('regulacao') || normSlug.includes('5-4-3-2-1') || normSlug.includes('emocoes');
  const isWellbeing = !isAnxiety && !isSleep && !isRegulation;

  const renderIllustration = () => {
    // -------------------------------------------------------------
    // ANSIEDADE (10 ARTIGOS)
    // -------------------------------------------------------------
    if (normSlug === 'o-que-e-ansiedade-e-como-ela-funciona') {
      // Mulher com a mão no peito respirando e ícones sutis de mente, coração e pulmão
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_anx_1" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FDF2EC" />
              <Stop offset="1" stopColor="#F9E0D4" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_anx_1)" />
          {/* Planta ao fundo */}
          <Path d="M40 300 Q60 210 50 170 Q40 230 40 300" fill="#7FA99B" opacity={0.6} />
          <Path d="M70 300 Q90 220 80 185 Q65 240 70 300" fill="#6B9788" opacity={0.5} />
          {/* Corpo / Mulher acolhedora */}
          <Circle cx="200" cy="115" r="42" fill="#E8B598" />
          {/* Cabelo */}
          <Path d="M158 115 C158 70 242 70 242 115 C242 145 230 160 230 160 L170 160 C170 160 158 145 158 115 Z" fill="#4A3428" />
          <Circle cx="200" cy="118" r="34" fill="#F3C3A8" />
          {/* Rosto sereno */}
          <Path d="M188 115 Q193 118 198 115" stroke="#4A3428" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <Path d="M202 115 Q207 118 212 115" stroke="#4A3428" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <Path d="M196 130 Q200 134 204 130" stroke="#C85A32" strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* Tronco & Blusa Verde-Água */}
          <Path d="M140 300 L150 190 Q200 180 250 190 L260 300 Z" fill="#3D7D72" />
          {/* Mão sobre o peito */}
          <Path d="M180 220 Q200 210 220 225 Q210 245 190 240 Z" fill="#F3C3A8" />
          {/* Círculos conceituais: Cérebro, Coração, Pulmão */}
          {/* 1. Mente */}
          <Circle cx="90" cy="85" r="28" fill="#FFFFFF" opacity={0.9} />
          <Path d="M78 85 Q90 70 102 85 Q90 100 78 85" stroke="#C85A32" strokeWidth="2.5" fill="none" />
          {/* 2. Coração */}
          <Circle cx="310" cy="130" r="28" fill="#FFFFFF" opacity={0.9} />
          <Path d="M300 130 L310 140 L320 130 Q325 120 315 120 Q310 125 310 125 Q310 125 305 120 Q295 120 300 130 Z" fill="#E76F51" />
          {/* 3. Pulmão / Respiração */}
          <Circle cx="320" cy="225" r="28" fill="#FFFFFF" opacity={0.9} />
          <Path d="M312 215 Q305 235 314 238 Q320 235 318 215" fill="#E8B598" />
          <Path d="M328 215 Q335 235 326 238 Q320 235 322 215" fill="#E8B598" />
        </Svg>
      );
    }

    if (normSlug === 'como-reconhecer-os-sinais-da-ansiedade') {
      // Mulher organizando pensamentos e xícara de chá
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_anx_2" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FEEFE8" />
              <Stop offset="1" stopColor="#F8D9CB" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_anx_2)" />
          {/* Mesa */}
          <Rect x="0" y="230" width="400" height="70" fill="#E5C3A6" />
          {/* Xícara com fumaça */}
          <Rect x="70" y="210" width="30" height="24" rx="4" fill="#3D7D72" />
          <Path d="M100 216 Q108 222 100 228" stroke="#3D7D72" strokeWidth="2.5" fill="none" />
          <Path d="M82 202 Q85 195 82 188" stroke="#A88B79" strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* Personagem com a mão na testa refletindo */}
          <Circle cx="200" cy="115" r="38" fill="#E8B598" />
          <Path d="M162 110 C162 65 238 65 238 110 C238 150 162 150 162 110 Z" fill="#543D31" />
          <Circle cx="200" cy="120" r="32" fill="#F3C3A8" />
          {/* Blusa */}
          <Path d="M140 300 L155 195 Q200 185 245 195 L260 300 Z" fill="#C85A32" />
          {/* Balão de pensamento suave */}
          <Circle cx="120" cy="65" r="22" fill="#FFFFFF" opacity={0.85} />
          <SvgText x="120" y="72" textAnchor="middle" fill="#C85A32" fontSize="20" fontWeight="bold">?</SvgText>
          <Circle cx="280" cy="65" r="22" fill="#FFFFFF" opacity={0.85} />
          <SvgText x="280" y="72" textAnchor="middle" fill="#247B74" fontSize="20" fontWeight="bold">!</SvgText>
        </Svg>
      );
    }

    if (normSlug === 'ansiedade-e-estresse-qual-e-a-diferenca') {
      // Balança equilibrada entre alerta e sobrecarga
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_anx_3" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#F9F1EB" />
              <Stop offset="1" stopColor="#F3DDD0" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_anx_3)" />
          {/* Base da balança */}
          <Path d="M185 260 L215 260 L205 130 L195 130 Z" fill="#5F706C" />
          <Rect x="160" y="260" width="80" height="12" rx="4" fill="#4A5553" />
          {/* Barra da balança */}
          <Rect x="80" y="125" width="240" height="8" rx="4" fill="#247B74" />
          <Circle cx="200" cy="129" r="8" fill="#17332F" />
          {/* Prato Esquerdo - Estresse */}
          <Path d="M90 133 L70 190 L130 190 Z" fill="none" stroke="#8C9E9B" strokeWidth="2" />
          <Circle cx="100" cy="180" r="20" fill="#E76F51" opacity={0.85} />
          {/* Prato Direito - Ansiedade */}
          <Path d="M310 133 L290 190 L350 190 Z" fill="none" stroke="#8C9E9B" strokeWidth="2" />
          <Circle cx="320" cy="180" r="20" fill="#5ECFC3" opacity={0.85} />
        </Svg>
      );
    }

    if (normSlug === 'o-que-acontece-no-corpo-durante-uma-crise-de-ansiedade') {
      // Percepção do ritmo cardíaco e fluxo de respiração
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_anx_4" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FCEDE5" />
              <Stop offset="1" stopColor="#F7D4C3" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_anx_4)" />
          {/* Silhueta calma */}
          <Circle cx="200" cy="90" r="35" fill="#E8B598" />
          <Path d="M140 280 L160 160 Q200 150 240 160 L260 280 Z" fill="#D38A70" />
          {/* Ondas cardíacas que se suavizam */}
          <Path d="M40 220 L130 220 L150 170 L170 260 L190 190 L210 230 L230 215 L360 220" stroke="#C85A32" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    }

    if (normSlug === 'como-acalmar-os-pensamentos-acelerados') {
      // Linhas caóticas se transformando em ondas suaves
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_anx_5" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FAF0E6" />
              <Stop offset="1" stopColor="#F5DCB7" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_anx_5)" />
          {/* Novelo de linhas se desenrolando */}
          <Path d="M50 150 Q70 90 110 150 Q140 210 180 150 C230 80 270 170 310 150 Q340 135 370 150" stroke="#C85A32" strokeWidth="3" fill="none" strokeLinecap="round" />
          <Path d="M70 120 Q100 180 140 120 Q180 190 230 130 Q280 160 350 140" stroke="#247B74" strokeWidth="2.5" fill="none" opacity={0.7} />
          {/* Folha suave no final */}
          <Path d="M365 145 Q385 130 380 150 Q365 160 365 145 Z" fill="#247B74" />
        </Svg>
      );
    }

    if (normSlug === 'ansiedade-antes-de-provas-reunioes-e-apresentacoes') {
      // Caderno, lâmpada suave e mesa organizada
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_anx_6" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FDF5E6" />
              <Stop offset="1" stopColor="#F8E5C8" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_anx_6)" />
          {/* Mesa */}
          <Rect x="30" y="210" width="340" height="14" rx="3" fill="#D3A27F" />
          {/* Caderno aberto */}
          <Rect x="130" y="170" width="140" height="42" rx="4" fill="#FFFFFF" stroke="#DDE6E3" strokeWidth="2" />
          <Path d="M200 170 L200 212" stroke="#DDE6E3" strokeWidth="2" />
          {/* Lâmpada de mesa */}
          <Path d="M70 210 L85 110 L110 110" stroke="#5F706C" strokeWidth="3" fill="none" />
          <Path d="M100 100 L130 125 L105 135 Z" fill="#F4A261" />
          {/* Luz suave */}
          <Path d="M125 125 L190 210 L100 210 Z" fill="#FFE8B2" opacity={0.5} />
        </Svg>
      );
    }

    if (normSlug === 'como-lidar-com-a-preocupacao-excessiva') {
      // Caixa/gaveta organizadora de pensamentos com planta
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_anx_7" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FDF0E9" />
              <Stop offset="1" stopColor="#F5D2C1" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_anx_7)" />
          {/* Caixa organizadora */}
          <Rect x="110" y="140" width="180" height="110" rx="10" fill="#FFFFFF" stroke="#C85A32" strokeWidth="2.5" />
          <Rect x="130" y="165" width="60" height="30" rx="4" fill="#EAF7F3" />
          <Rect x="210" y="165" width="60" height="30" rx="4" fill="#FDF0E9" />
          {/* Planta brotando */}
          <Path d="M200 140 Q185 90 200 65 Q215 90 200 140" fill="#247B74" />
          <Path d="M200 95 Q230 85 235 105 Q210 115 200 95" fill="#3D9B8F" />
        </Svg>
      );
    }

    if (normSlug === 'habitos-que-podem-aumentar-a-ansiedade') {
      // Celular pousado ao lado de um copo d'água e livro
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_anx_8" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FEEFEA" />
              <Stop offset="1" stopColor="#FAD8CA" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_anx_8)" />
          {/* Livro */}
          <Rect x="70" y="190" width="110" height="60" rx="4" fill="#247B74" />
          {/* Celular virado */}
          <Rect x="210" y="180" width="65" height="75" rx="8" fill="#4A5553" />
          <Circle cx="242" cy="245" r="4" fill="#FFFFFF" opacity={0.6} />
          {/* Copo d'água */}
          <Path d="M305 175 L335 175 L330 250 L310 250 Z" fill="#EAF7F3" stroke="#89B8AF" strokeWidth="2" />
        </Svg>
      );
    }

    if (normSlug === 'como-apoiar-alguem-que-esta-ansioso') {
      // Duas xícaras de chá em conversa acolhedora
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_anx_9" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FDF2EC" />
              <Stop offset="1" stopColor="#F7DDD0" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_anx_9)" />
          {/* Mesa redonda */}
          <Circle cx="200" cy="270" r="140" fill="#E8D1BE" />
          {/* Xícara 1 */}
          <Rect x="120" y="180" width="46" height="36" rx="6" fill="#C85A32" />
          <Path d="M120 188 Q105 196 120 206" stroke="#C85A32" strokeWidth="3" fill="none" />
          {/* Xícara 2 */}
          <Rect x="234" y="180" width="46" height="36" rx="6" fill="#247B74" />
          <Path d="M280 188 Q295 196 280 206" stroke="#247B74" strokeWidth="3" fill="none" />
          {/* Coração sutil no centro */}
          <Path d="M192 145 L200 155 L208 145 Q213 138 204 138 Q200 142 200 142 Q200 142 196 138 Q187 138 192 145 Z" fill="#E76F51" />
        </Svg>
      );
    }

    if (normSlug === 'quando-procurar-ajuda-profissional') {
      // Poltrona acolhedora com planta e janela
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_anx_10" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FDF3EE" />
              <Stop offset="1" stopColor="#F8DECF" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_anx_10)" />
          {/* Janela ao fundo */}
          <Rect x="60" y="40" width="110" height="130" rx="8" fill="#EAF7F3" stroke="#DDE6E3" strokeWidth="3" />
          <Path d="M115 40 L115 170 M60 105 L170 105" stroke="#DDE6E3" strokeWidth="2" />
          {/* Poltrona confortável */}
          <Rect x="200" y="150" width="130" height="90" rx="14" fill="#3D7D72" />
          <Rect x="180" y="170" width="26" height="60" rx="10" fill="#2E6259" />
          <Rect x="324" y="170" width="26" height="60" rx="10" fill="#2E6259" />
          <Path d="M220 240 L210 270 M310 240 L320 270" stroke="#8C6F59" strokeWidth="4" strokeLinecap="round" />
        </Svg>
      );
    }

    // -------------------------------------------------------------
    // SONO (10 ARTIGOS)
    // -------------------------------------------------------------
    if (normSlug === 'como-desacelerar-a-mente-antes-de-dormir') {
      // Quarto noturno com abajur quente, lua na janela e pessoa dormindo serena
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_sleep_1" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#1B2838" />
              <Stop offset="1" stopColor="#2A3B52" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_sleep_1)" />
          {/* Janela com Lua */}
          <Rect x="260" y="30" width="90" height="110" rx="6" fill="#141E2B" />
          <Circle cx="305" cy="75" r="22" fill="#F4D06F" />
          <Circle cx="313" cy="70" r="20" fill="#141E2B" />
          {/* Cama e Travesseiro */}
          <Rect x="30" y="190" width="260" height="90" rx="12" fill="#384D68" />
          <Rect x="40" y="165" width="80" height="35" rx="8" fill="#5A718F" />
          {/* Mulher dormindo */}
          <Circle cx="80" cy="165" r="22" fill="#F3C3A8" />
          <Path d="M60 160 C60 135 100 135 100 160 Z" fill="#3A281E" />
          {/* Abajur aceso */}
          <Rect x="310" y="200" width="40" height="70" rx="4" fill="#3E2C22" />
          <Path d="M305 195 L355 195 L345 155 L315 155 Z" fill="#F9E79F" />
          <Circle cx="330" cy="180" r="16" fill="#FFF2B2" opacity={0.6} />
        </Svg>
      );
    }

    if (normSlug === 'como-criar-uma-rotina-noturna-saudavel') {
      // Difusor de aromas com vapor suave, livro aberto e cama arrumada
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_sleep_2" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#222C3D" />
              <Stop offset="1" stopColor="#313E54" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_sleep_2)" />
          {/* Mesa de cabeceira */}
          <Rect x="60" y="180" width="120" height="100" rx="6" fill="#4B382A" />
          {/* Difusor de aromas */}
          <Path d="M105 180 Q120 135 135 180 Z" fill="#E8D1BE" />
          {/* Vapor aromático suave */}
          <Path d="M120 135 Q115 105 125 80 Q135 60 120 40" stroke="#A8D0C3" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity={0.7} />
          {/* Cama ao lado */}
          <Rect x="200" y="160" width="180" height="120" rx="10" fill="#475B76" />
          <Rect x="215" y="145" width="70" height="30" rx="6" fill="#7086A3" />
        </Svg>
      );
    }

    if (normSlug === 'a-relacao-entre-ansiedade-e-dificuldade-para-dormir') {
      // Relógio sutil e travesseiro com tons lavanda
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_sleep_3" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#26243D" />
              <Stop offset="1" stopColor="#3F395F" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_sleep_3)" />
          {/* Relógio na parede */}
          <Circle cx="200" cy="110" r="50" fill="#312C4E" stroke="#7E72A8" strokeWidth="3" />
          <Path d="M200 80 L200 110 L225 110" stroke="#F4D06F" strokeWidth="3" strokeLinecap="round" />
          {/* Travesseiro aconchegante */}
          <Rect x="120" y="200" width="160" height="60" rx="16" fill="#685E8C" />
        </Svg>
      );
    }

    if (normSlug === 'como-as-telas-afetam-a-qualidade-do-sono') {
      // Celular em modo silencioso virado para baixo sob luz quente
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_sleep_4" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#1E293B" />
              <Stop offset="1" stopColor="#2D3E54" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_sleep_4)" />
          {/* Mesa */}
          <Rect x="40" y="200" width="320" height="20" rx="4" fill="#584233" />
          {/* Celular com tela virada */}
          <Rect x="150" y="160" width="100" height="42" rx="8" fill="#0F172A" stroke="#475569" strokeWidth="2" />
          {/* Lua suave acima */}
          <Circle cx="200" cy="80" r="30" fill="#93C5FD" opacity={0.6} />
        </Svg>
      );
    }

    if (normSlug === 'como-preparar-o-quarto-para-descansar-melhor') {
      // Cortinas fechadas e ambiente sereno
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_sleep_5" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#1F2438" />
              <Stop offset="1" stopColor="#323C59" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_sleep_5)" />
          {/* Cortinas elegantes */}
          <Path d="M70 30 L140 30 L110 260 L70 260 Z" fill="#3D4B6E" />
          <Path d="M330 30 L260 30 L290 260 L330 260 Z" fill="#3D4B6E" />
          {/* Cama no centro */}
          <Rect x="140" y="170" width="120" height="90" rx="8" fill="#53678F" />
        </Svg>
      );
    }

    if (normSlug === 'o-que-fazer-quando-o-sono-nao-chega') {
      // Poltrona de leitura noturna com luz suave
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_sleep_6" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#252438" />
              <Stop offset="1" stopColor="#383652" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_sleep_6)" />
          <Rect x="140" y="140" width="120" height="100" rx="14" fill="#4F4A6F" />
          <Rect x="170" y="170" width="60" height="40" rx="4" fill="#F4D06F" opacity={0.8} />
        </Svg>
      );
    }

    if (normSlug === 'por-que-acordamos-cansados-mesmo-depois-de-dormir') {
      // Janela com sol da manhã nascendo e alongamento
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_sleep_7" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#2E384D" />
              <Stop offset="1" stopColor="#5A657D" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_sleep_7)" />
          <Circle cx="200" cy="110" r="45" fill="#F9A826" />
          <Path d="M120 250 Q200 180 280 250" fill="#E2E8F0" opacity={0.8} />
        </Svg>
      );
    }

    if (normSlug === 'exercicios-de-respiracao-para-o-periodo-noturno') {
      // Padrão de respiração com lua e estrelas suaves
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_sleep_8" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#1E2838" />
              <Stop offset="1" stopColor="#2C3D54" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_sleep_8)" />
          <Circle cx="200" cy="150" r="70" stroke="#5ECFC3" strokeWidth="3" fill="none" opacity={0.6} />
          <Circle cx="200" cy="150" r="45" stroke="#93C5FD" strokeWidth="2.5" fill="none" opacity={0.8} />
          <Circle cx="200" cy="150" r="20" fill="#F4D06F" />
        </Svg>
      );
    }

    if (normSlug === 'a-importancia-de-manter-horarios-regulares') {
      // Ciclo diurno e noturno integrado
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_sleep_9" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#1E2B3E" />
              <Stop offset="1" stopColor="#374D6B" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_sleep_9)" />
          <Path d="M130 150 A70 70 0 0 1 270 150" stroke="#F6AD55" strokeWidth="4" fill="none" />
          <Path d="M270 150 A70 70 0 0 1 130 150" stroke="#68D391" strokeWidth="4" fill="none" />
        </Svg>
      );
    }

    if (normSlug === 'habitos-durante-o-dia-que-ajudam-a-dormir-melhor') {
      // Caminhada e luz natural
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_sleep_10" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#253549" />
              <Stop offset="1" stopColor="#455B77" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_sleep_10)" />
          <Circle cx="280" cy="90" r="35" fill="#FBD38D" />
          <Path d="M50 250 Q160 170 350 250" fill="#38A169" opacity={0.7} />
        </Svg>
      );
    }

    // -------------------------------------------------------------
    // BEM-ESTAR (10 ARTIGOS)
    // -------------------------------------------------------------
    if (normSlug === 'a-importancia-das-pequenas-pausas-durante-o-dia') {
      // Mulher sentada em poltrona verde com xícara de chá e quadro botânico
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_well_1" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#EAF5F0" />
              <Stop offset="1" stopColor="#D5EBE1" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_well_1)" />
          {/* Quadro botânico */}
          <Rect x="70" y="40" width="70" height="90" rx="4" fill="#FFFFFF" stroke="#B2D3C7" strokeWidth="2" />
          <Path d="M105 110 Q100 70 105 60 Q110 70 105 110" fill="#38A169" />
          {/* Poltrona Verde */}
          <Rect x="160" y="140" width="140" height="100" rx="16" fill="#3D7D72" />
          <Circle cx="230" cy="120" r="28" fill="#F3C3A8" />
          {/* Xícara quente */}
          <Rect x="215" y="160" width="30" height="22" rx="4" fill="#FEEBC8" />
        </Svg>
      );
    }

    if (normSlug === 'como-praticar-autocuidado-em-uma-rotina-corrida') {
      // Vaso de flores e cuidados simples
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_well_2" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#EDF7F2" />
              <Stop offset="1" stopColor="#D8EEE3" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_well_2)" />
          <Path d="M170 250 L230 250 L220 180 L180 180 Z" fill="#E2847A" />
          <Circle cx="200" cy="140" r="25" fill="#F6AD55" />
          <Circle cx="170" cy="125" r="20" fill="#68D391" />
          <Circle cx="230" cy="125" r="20" fill="#4FD1C5" />
        </Svg>
      );
    }

    if (normSlug === 'como-aprender-a-respeitar-os-proprios-limites') {
      // Escudo suave e equilíbrio de espaço
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_well_3" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#EEF7F2" />
              <Stop offset="1" stopColor="#D8EDE2" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_well_3)" />
          <Circle cx="200" cy="150" r="70" fill="#FFFFFF" stroke="#3D7D72" strokeWidth="3" />
          <Path d="M200 110 L235 130 L235 170 Q200 200 200 200 Q165 170 165 130 L200 110 Z" fill="#3D7D72" opacity={0.85} />
        </Svg>
      );
    }

    if (normSlug === 'como-criar-uma-rotina-emocionalmente-saudavel') {
      // Planner organizado com elementos de bem-estar
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_well_4" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#F0F8F4" />
              <Stop offset="1" stopColor="#DBEFE5" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_well_4)" />
          <Rect x="120" y="80" width="160" height="150" rx="10" fill="#FFFFFF" stroke="#A8D0C3" strokeWidth="2.5" />
          <Rect x="140" y="110" width="30" height="8" rx="2" fill="#3D7D72" />
          <Rect x="140" y="135" width="80" height="6" rx="2" fill="#E2E8F0" />
          <Rect x="140" y="155" width="100" height="6" rx="2" fill="#E2E8F0" />
          <Circle cx="245" cy="114" r="8" fill="#48BB78" />
        </Svg>
      );
    }

    if (normSlug === 'descansar-tambem-faz-parte-da-produtividade') {
      // Rede de descanso e livro
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_well_5" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#EDF7F2" />
              <Stop offset="1" stopColor="#D5EBE0" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_well_5)" />
          <Path d="M70 110 Q200 230 330 110" stroke="#3D7D72" strokeWidth="4" fill="none" strokeLinecap="round" />
          <Circle cx="200" cy="165" r="24" fill="#FBD38D" />
        </Svg>
      );
    }

    if (normSlug === 'como-diminuir-a-sobrecarga-mental') {
      // Potes de organização mental
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_well_6" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#F1F8F5" />
              <Stop offset="1" stopColor="#DAEFE6" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_well_6)" />
          <Rect x="80" y="140" width="65" height="90" rx="8" fill="#FFFFFF" stroke="#3D7D72" strokeWidth="2" />
          <Rect x="168" y="140" width="65" height="90" rx="8" fill="#FFFFFF" stroke="#3D7D72" strokeWidth="2" />
          <Rect x="255" y="140" width="65" height="90" rx="8" fill="#FFFFFF" stroke="#3D7D72" strokeWidth="2" />
          <Circle cx="112" cy="185" r="16" fill="#81E6D9" />
          <Circle cx="200" cy="185" r="16" fill="#F6AD55" />
          <Circle cx="287" cy="185" r="16" fill="#68D391" />
        </Svg>
      );
    }

    if (normSlug === 'movimento-e-atividade-fisica-para-o-bem-estar') {
      // Tapete de alongamento e planta
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_well_7" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#EFF7F3" />
              <Stop offset="1" stopColor="#D9EFE5" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_well_7)" />
          <Rect x="80" y="190" width="240" height="35" rx="6" fill="#3D7D72" />
          <Circle cx="200" cy="120" r="30" fill="#F6AD55" />
        </Svg>
      );
    }

    if (normSlug === 'como-ter-uma-relacao-saudavel-com-a-produtividade') {
      // Ampulheta calma com planta
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_well_8" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#EEF7F2" />
              <Stop offset="1" stopColor="#D7EDE1" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_well_8)" />
          <Path d="M160 100 L240 100 L200 150 L240 200 L160 200 L200 150 Z" stroke="#3D7D72" strokeWidth="3" fill="#FFFFFF" />
          <Circle cx="200" cy="175" r="12" fill="#F6AD55" />
        </Svg>
      );
    }

    if (normSlug === 'gratidao-sem-ignorar-as-emocoes-dificeis') {
      // Diário com coração acolhido
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_well_9" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#F1F8F4" />
              <Stop offset="1" stopColor="#DCF0E6" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_well_9)" />
          <Rect x="120" y="90" width="160" height="130" rx="10" fill="#FFFFFF" stroke="#E2847A" strokeWidth="2.5" />
          <Path d="M190 145 L200 155 L210 145 Q215 138 206 138 Q200 142 200 142 Q200 142 194 138 Q185 138 190 145 Z" fill="#E2847A" />
        </Svg>
      );
    }

    if (normSlug === 'como-criar-habitos-de-autocuidado-duradouros') {
      // Broto de planta crescendo
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_well_10" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#EEF7F2" />
              <Stop offset="1" stopColor="#D5EBE0" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_well_10)" />
          <Path d="M200 240 L200 140" stroke="#3D7D72" strokeWidth="4" strokeLinecap="round" />
          <Path d="M200 170 Q160 140 170 180 Q190 180 200 170 Z" fill="#48BB78" />
          <Path d="M200 150 Q240 120 230 160 Q210 160 200 150 Z" fill="#38A169" />
        </Svg>
      );
    }

    // -------------------------------------------------------------
    // REGULAÇÃO (10 ARTIGOS)
    // -------------------------------------------------------------
    if (normSlug === 'o-que-e-regulacao-emocional') {
      // Indicador de equilíbrio emocional
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_reg_1" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#EEF4FC" />
              <Stop offset="1" stopColor="#D7E5F9" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_reg_1)" />
          <Circle cx="200" cy="150" r="70" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="3" />
          <Path d="M150 150 Q200 100 250 150 Q200 200 150 150 Z" fill="#60A5FA" opacity={0.6} />
        </Svg>
      );
    }

    if (normSlug === 'tecnica-5-4-3-2-1-para-voltar-ao-presente') {
      // Os 5 sentidos ilustrados
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_reg_2" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#F0F4FC" />
              <Stop offset="1" stopColor="#DAE5F9" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_reg_2)" />
          <Circle cx="100" cy="110" r="28" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="2" />
          <Circle cx="200" cy="80" r="28" fill="#FFFFFF" stroke="#10B981" strokeWidth="2" />
          <Circle cx="300" cy="110" r="28" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2" />
          <Circle cx="150" cy="200" r="28" fill="#FFFFFF" stroke="#EC4899" strokeWidth="2" />
          <Circle cx="250" cy="200" r="28" fill="#FFFFFF" stroke="#8B5CF6" strokeWidth="2" />
        </Svg>
      );
    }

    if (normSlug === 'como-identificar-e-nomear-suas-emocoes') {
      // Paleta de cartões de emoções
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_reg_3" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#F3F0FC" />
              <Stop offset="1" stopColor="#DDD5F8" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_reg_3)" />
          <Rect x="90" y="110" width="60" height="90" rx="8" fill="#FCA5A5" />
          <Rect x="170" y="90" width="60" height="90" rx="8" fill="#93C5FD" />
          <Rect x="250" y="110" width="60" height="90" rx="8" fill="#A7F3D0" />
        </Svg>
      );
    }

    if (normSlug === 'como-responder-sem-agir-por-impulso') {
      // Botão de pausa entre estímulo e resposta
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_reg_4" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#EFF4FC" />
              <Stop offset="1" stopColor="#D9E6FA" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_reg_4)" />
          <Circle cx="200" cy="150" r="60" fill="#247B74" />
          <Rect x="182" y="130" width="12" height="40" rx="3" fill="#FFFFFF" />
          <Rect x="206" y="130" width="12" height="40" rx="3" fill="#FFFFFF" />
        </Svg>
      );
    }

    if (normSlug === 'tecnicas-de-aterramento-para-momentos-intensos') {
      // Raízes de ancoragem
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_reg_5" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#EFF6F3" />
              <Stop offset="1" stopColor="#D8ECE3" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_reg_5)" />
          <Path d="M200 70 Q160 140 200 200" stroke="#3D7D72" strokeWidth="4" fill="none" />
          <Path d="M200 200 Q150 250 110 270 M200 200 Q200 260 200 280 M200 200 Q250 250 290 270" stroke="#3D7D72" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </Svg>
      );
    }

    if (normSlug === 'como-acolher-emocoes-desconfortaveis') {
      // Mãos acolhendo
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_reg_6" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#F5EEFA" />
              <Stop offset="1" stopColor="#E2D4F2" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_reg_6)" />
          <Path d="M120 220 Q160 170 200 210 Q240 170 280 220" stroke="#8E7CC3" strokeWidth="4" fill="none" strokeLinecap="round" />
          <Circle cx="200" cy="140" r="26" fill="#F4A261" />
        </Svg>
      );
    }

    if (normSlug === 'como-a-respiracao-ajuda-a-regular-o-corpo') {
      // Diagrama de ondas de respiração
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_reg_7" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#EFF5FA" />
              <Stop offset="1" stopColor="#D9E7F4" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_reg_7)" />
          <Path d="M40 150 Q120 70 200 150 T360 150" stroke="#247B74" strokeWidth="4" fill="none" strokeLinecap="round" />
          <Path d="M40 150 Q120 230 200 150 T360 150" stroke="#60A5FA" strokeWidth="3" fill="none" strokeLinecap="round" opacity={0.6} />
        </Svg>
      );
    }

    if (normSlug === 'como-lidar-com-irritacao-e-frustracao') {
      // Transformação de fogo em água calma
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_reg_8" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FAF0EE" />
              <Stop offset="1" stopColor="#F5D9D3" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_reg_8)" />
          <Circle cx="150" cy="150" r="40" fill="#F87171" opacity={0.8} />
          <Circle cx="250" cy="150" r="40" fill="#60A5FA" opacity={0.8} />
        </Svg>
      );
    }

    if (normSlug === 'estrategias-para-momentos-de-sobrecarga-emocional') {
      // Descarregando sobrecarga
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_reg_9" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#F0F4FA" />
              <Stop offset="1" stopColor="#DBE4F5" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_reg_9)" />
          <Rect x="140" y="110" width="120" height="110" rx="14" fill="#64748B" />
          <Path d="M170 110 L170 80 Q200 60 230 80 L230 110" stroke="#475569" strokeWidth="4" fill="none" />
        </Svg>
      );
    }

    if (normSlug === 'como-recuperar-o-equilibrio-depois-de-um-dia-dificil') {
      // Xícara quente e cobertor aconchegante
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_reg_10" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#F4F1FB" />
              <Stop offset="1" stopColor="#DFD8F6" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_reg_10)" />
          <Circle cx="200" cy="140" r="45" fill="#8B5CF6" opacity={0.7} />
          <Path d="M150 240 Q200 180 250 240" fill="#EDE9FE" />
        </Svg>
      );
    }

    // -------------------------------------------------------------
    // FALLBACKS HARMONIOSOS POR CATEGORIA
    // -------------------------------------------------------------
    if (isAnxiety) {
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_anx_def" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FDF0E9" />
              <Stop offset="1" stopColor="#F7DDD0" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_anx_def)" />
          <Circle cx="200" cy="140" r="50" fill="#E8B598" opacity={0.8} />
          <Path d="M120 280 Q200 180 280 280" fill="#3D7D72" />
        </Svg>
      );
    }

    if (isSleep) {
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_sleep_def" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#1E2838" />
              <Stop offset="1" stopColor="#2D3E54" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_sleep_def)" />
          <Circle cx="200" cy="120" r="36" fill="#F4D06F" />
          <Circle cx="214" cy="112" r="34" fill="#1E2838" />
          <Rect x="100" y="200" width="200" height="60" rx="8" fill="#4B607E" />
        </Svg>
      );
    }

    if (isRegulation) {
      return (
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <Defs>
            <LinearGradient id="bg_reg_def" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#EFF4FA" />
              <Stop offset="1" stopColor="#DAE5F4" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="300" fill="url(#bg_reg_def)" />
          <Circle cx="200" cy="150" r="50" fill="#5ECFC3" opacity={0.8} />
          <Path d="M130 150 Q200 80 270 150" stroke="#247B74" strokeWidth="4" fill="none" />
        </Svg>
      );
    }

    // Default Bem-estar
    return (
      <Svg viewBox="0 0 400 300" width="100%" height="100%">
        <Defs>
          <LinearGradient id="bg_well_def" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#EDF7F2" />
            <Stop offset="1" stopColor="#D5EBE0" />
          </LinearGradient>
        </Defs>
        <Rect width="400" height="300" fill="url(#bg_well_def)" />
        <Circle cx="200" cy="130" r="45" fill="#F6AD55" opacity={0.8} />
        <Path d="M120 280 Q200 170 280 280" fill="#3D7D72" />
      </Svg>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={`Capa ilustrada para ${slug}`}
    >
      {renderIllustration()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#F8FAF9',
  },
});
