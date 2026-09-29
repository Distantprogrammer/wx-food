<template>
  <text class="audit-status-tag" :class="[normalized, variantClass]">{{ label }}</text>
</template>

<script setup>
import { computed } from 'vue'

const AUDIT_LABEL = {
  pending: '待审',
  approved: '已通过',
  rejected: '已驳回'
}

const FEEDBACK_LABEL = {
  pending: '未读',
  read: '已读',
  processed: '已处理',
  rejected: '不予处理'
}

const props = defineProps({
  status: { type: String, default: 'pending' },
  text: { type: String, default: '' },
  /** audit | feedback */
  variant: { type: String, default: 'audit' }
})

const normalized = computed(() => {
  const s = String(props.status || '').trim()
  if (props.variant === 'feedback') {
    if (FEEDBACK_LABEL[s]) return s
    return 'pending'
  }
  if (AUDIT_LABEL[s] || s === 'read' || s === 'processed') return s
  return 'pending'
})

const variantClass = computed(() => (props.variant === 'feedback' ? 'is-feedback' : 'is-audit'))

const label = computed(() => {
  if (props.text) return props.text
  if (props.variant === 'feedback') return FEEDBACK_LABEL[normalized.value] || FEEDBACK_LABEL.pending
  return AUDIT_LABEL[normalized.value] || AUDIT_LABEL.pending
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.audit-status-tag {
  @include status-tag;

  &.is-feedback.pending {
    color: $error-color;
    background: $error-soft;
  }

  &.is-feedback.rejected {
    color: $text-secondary;
    background: $bg-muted;
  }
}
</style>
