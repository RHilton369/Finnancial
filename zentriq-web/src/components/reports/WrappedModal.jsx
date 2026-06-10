import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, TrendingUp, TrendingDown, Target, Award } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import styles from './WrappedModal.module.css';

export default function WrappedModal({ data, onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fecha o modal com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentSlide < 3) setCurrentSlide(c => c + 1);
      if (e.key === 'ArrowLeft' && currentSlide > 0) setCurrentSlide(c => c - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, currentSlide]);

  if (!data) return null;

  const slides = [
    // Slide 1: Resumo Geral
    <div key="1" className={styles.slide}>
      <h2 className={styles.title}>O seu mês de {data.monthLabel}</h2>
      <div className={styles.value}>{formatCurrency(data.income)}</div>
      <p className={styles.subtitle}>
        Foi o que você fez entrar na conta.<br/>
        Mas você também gastou <span className={styles.highlightExpense}>{formatCurrency(data.expense)}</span>.
      </p>
    </div>,

    // Slide 2: Taxa de Economia
    <div key="2" className={styles.slide}>
      <Target size={48} color="var(--color-income)" style={{marginBottom: 24}} />
      <h2 className={styles.title}>Taxa de Economia</h2>
      <div className={styles.value} style={{color: 'var(--color-income)'}}>{data.savingRate}%</div>
      <p className={styles.subtitle}>
        {data.savingRate >= 20 
          ? "Excelente! Você poupou uma ótima fatia da sua renda."
          : data.savingRate > 0 
            ? "Você conseguiu fechar no azul! Que tal tentar guardar um pouco mais no próximo mês?"
            : "Ops... O mês fechou no vermelho. Hora de rever os gastos."}
      </p>
    </div>,

    // Slide 3: Categoria Vilã
    <div key="3" className={styles.slide}>
      <TrendingDown size={48} color="var(--color-expense)" style={{marginBottom: 24}} />
      <h2 className={styles.title}>Onde seu dinheiro foi parar?</h2>
      {data.topCategory ? (
        <>
          <div className={styles.value} style={{fontSize: '2.5rem', color: 'var(--color-expense)'}}>
            {data.topCategory.name}
          </div>
          <p className={styles.subtitle}>
            Foi a sua categoria campeã de gastos, levando <span className={styles.highlightExpense}>{formatCurrency(data.topCategory.amount)}</span> do seu orçamento.
          </p>
        </>
      ) : (
        <p className={styles.subtitle}>Nenhuma despesa registrada neste mês!</p>
      )}
    </div>,

    // Slide 4: Comparativo
    <div key="4" className={styles.slide}>
      <Award size={48} color="var(--color-primary)" style={{marginBottom: 24}} />
      <h2 className={styles.title}>Evolução</h2>
      <div className={styles.value} style={{fontSize: '2.5rem'}}>
        {data.expenseDiff < 0 ? 'Parabéns!' : 'Atenção!'}
      </div>
      <p className={styles.subtitle}>
        Você gastou <span className={data.expenseDiff < 0 ? styles.highlight : styles.highlightExpense}>
          {formatCurrency(Math.abs(data.expenseDiff))}
        </span> {data.expenseDiff < 0 ? 'A MENOS' : 'A MAIS'} do que no mês anterior.
      </p>
    </div>
  ];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
          <X size={24} />
        </button>

        <div className={styles.progress}>
          {slides.map((_, idx) => (
            <div key={idx} className={styles.bar}>
              <div className={`${styles.fill} ${idx <= currentSlide ? styles.fillActive : ''}`} />
            </div>
          ))}
        </div>

        {slides[currentSlide]}

        <div className={styles.controls}>
          <button 
            className={styles.navBtn} 
            disabled={currentSlide === 0}
            onClick={() => setCurrentSlide(c => c - 1)}
            style={{visibility: currentSlide === 0 ? 'hidden' : 'visible'}}
          >
            <ChevronLeft size={24} />
          </button>
          
          <button 
            className={styles.navBtn} 
            onClick={() => {
              if (currentSlide < slides.length - 1) {
                setCurrentSlide(c => c + 1);
              } else {
                onClose();
              }
            }}
          >
            {currentSlide < slides.length - 1 ? <ChevronRight size={24} /> : 'Concluir'}
          </button>
        </div>
      </div>
    </div>
  );
}
