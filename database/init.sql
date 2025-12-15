CREATE DATABASE  IF NOT EXISTS `sistema_locacao` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `sistema_locacao`;
-- MySQL dump 10.13  Distrib 8.0.44, for Linux (x86_64)
--
-- Host: localhost    Database: sistema_locacao
-- ------------------------------------------------------
-- Server version	8.0.44-0ubuntu0.24.04.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `adicionais`
--

DROP TABLE IF EXISTS `adicionais`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `adicionais` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `preco` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `adicionais`
--

LOCK TABLES `adicionais` WRITE;
/*!40000 ALTER TABLE `adicionais` DISABLE KEYS */;
INSERT INTO `adicionais` VALUES (1,'Kit Multimídia (Projetor 4K + Tela)',80.00),(2,'Coffee Break Básico (Café + Biscoitos)',40.00),(3,'Coffee Break Premium (Salgados + Sucos)',120.00),(4,'Notebook Extra (i7 + SSD)',150.00),(5,'Quadros + Marcadores',30.00),(6,'Sistema de Som + Microfone',100.00),(7,'Gravação da Reunião (Arquivo Digital)',200.00),(8,'Água e Café Expresso (Ilimitado)',50.00),(9,'Impressão de Apostilas (até 20un)',90.00),(10,'Apoio Técnico (Suporte TI Dedicado)',180.00);
/*!40000 ALTER TABLE `adicionais` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `espacos`
--

DROP TABLE IF EXISTS `espacos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `espacos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `tipo` enum('sala_reuniao','auditorio','coworking','laboratorio') NOT NULL,
  `capacidade` int NOT NULL,
  `descricao` text,
  `preco_hora` decimal(10,2) NOT NULL,
  `imagem_url` varchar(500) DEFAULT 'https://images.unsplash.com/photo-1497366216548-37526070297c',
  `status` enum('ativo','inativo') DEFAULT 'ativo',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `espacos`
--

LOCK TABLES `espacos` WRITE;
/*!40000 ALTER TABLE `espacos` DISABLE KEYS */;
INSERT INTO `espacos` VALUES (3,'Auditório Principal','auditorio',300,'Espaço amplo com sistema de som surround, projetor 4K e isolamento acústico. Perfeito para grandes conferências.',300.00,'/uploads/1765802774393.jpg','ativo'),(4,'Sala de Reunião Alpha','sala_reuniao',10,'Sala executiva com mesa oval, cadeiras ergonômicas e TV de 65 polegadas para apresentações.',60.00,'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop','ativo'),(5,'Laboratório de Inovação','laboratorio',25,'Equipado com 25 iMacs de última geração, impressoras 3D e bancadas de eletrônica.',150.00,'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?q=80&w=1000&auto=format&fit=crop','ativo'),(6,'Espaço Coworking Open','coworking',40,'Área de trabalho compartilhada com ambiente descontraído, café liberado e internet de alta velocidade.',40.00,'/uploads/1765802736462.jpg','ativo'),(7,'Sala Criativa (Brainstorm)','sala_reuniao',8,'Ambiente colorido com puffs, lousa de vidro e iluminação ajustável para estimular a criatividade.',45.00,'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=1000&auto=format&fit=crop','ativo'),(8,'Mini Auditório Tech','auditorio',40,'Ideal para workshops e treinamentos menores. Possui quadro interativo.',120.00,'https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=1000&auto=format&fit=crop','ativo'),(9,'Sala de Videoconferência','sala_reuniao',4,'Sala compacta com isolamento acústico total e equipamento profissional de videoconferência (Cisco).',55.00,'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop','ativo'),(10,'Laboratório de Robótica','laboratorio',15,'Bancadas industriais, braços robóticos educacionais e kit completo de Arduino/Raspberry Pi.',110.00,'/uploads/1765802679708.jpg','ativo'),(11,'Sala de Reunião Beta','sala_reuniao',12,'Vista panorâmica da cidade, ideal para reuniões com clientes importantes.',80.00,'https://images.unsplash.com/photo-1568992687947-868a62a9f521?q=80&w=1000&auto=format&fit=crop','ativo'),(12,'Estúdio de Gravação','laboratorio',5,'Estúdio com chroma key, iluminação profissional e microfones de podcast.',95.00,'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1000&auto=format&fit=crop','ativo'),(13,'Sala de Treinamento A','sala_reuniao',20,'Configuração escolar com carteiras individuais e projetor. Ótimo para cursos.',70.00,'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1000&auto=format&fit=crop','ativo'),(14,'Lounge Executivo','coworking',15,'Área premium com sofás de couro e ambiente silencioso para leitura e trabalho focado.',35.00,'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1000&auto=format&fit=crop','ativo'),(15,'Sala de Reunião Gamma','sala_reuniao',6,'Econômica e funcional. Mesa retangular e whiteboard padrão.',40.00,'https://images.unsplash.com/photo-1577412647305-991150c7d163?q=80&w=1000&auto=format&fit=crop','ativo'),(16,'Laboratório de Hardware','laboratorio',12,'Equipado com osciloscópios, fontes de bancada e estação de solda.',130.00,'/uploads/1765802521950.avif','ativo'),(17,'Auditório ao Ar Livre','auditorio',60,'Espaço coberto em área externa, cercado por jardim. Excelente para eventos diurnos.',180.00,'/uploads/1765802284508.jpg','ativo');
/*!40000 ALTER TABLE `espacos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reserva_adicionais`
--

DROP TABLE IF EXISTS `reserva_adicionais`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reserva_adicionais` (
  `reserva_id` int NOT NULL,
  `adicional_id` int NOT NULL,
  KEY `reserva_id` (`reserva_id`),
  KEY `adicional_id` (`adicional_id`),
  CONSTRAINT `reserva_adicionais_ibfk_1` FOREIGN KEY (`reserva_id`) REFERENCES `reservas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reserva_adicionais_ibfk_2` FOREIGN KEY (`adicional_id`) REFERENCES `adicionais` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reserva_adicionais`
--

LOCK TABLES `reserva_adicionais` WRITE;
/*!40000 ALTER TABLE `reserva_adicionais` DISABLE KEYS */;
INSERT INTO `reserva_adicionais` VALUES (25,5),(25,2),(25,8),(25,3);
/*!40000 ALTER TABLE `reserva_adicionais` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservas`
--

DROP TABLE IF EXISTS `reservas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `espaco_id` int NOT NULL,
  `data_reserva` date NOT NULL,
  `horario_inicio` time NOT NULL,
  `horario_fim` time NOT NULL,
  `status` enum('confirmada','cancelada') DEFAULT 'confirmada',
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `visivel_usuario` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `espaco_id` (`espaco_id`),
  CONSTRAINT `reservas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `reservas_ibfk_2` FOREIGN KEY (`espaco_id`) REFERENCES `espacos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservas`
--

LOCK TABLES `reservas` WRITE;
/*!40000 ALTER TABLE `reservas` DISABLE KEYS */;
INSERT INTO `reservas` VALUES (25,2,3,'2025-12-15','20:00:00','22:00:00','confirmada','2025-12-15 22:22:37',1);
/*!40000 ALTER TABLE `reservas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `cpf_cnpj` varchar(20) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `senha_hash` varchar(255) NOT NULL,
  `nivel_acesso` enum('admin','comum') DEFAULT 'comum',
  `data_criacao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Super','admin@inovase.com','','','$2b$10$pn9LKqQ41r9.RHQW/GJ0seT9I.9hJaPB3GYyF8IE/TXVbZVwhTUxm','admin','2025-12-14 17:36:40'),(2,'Kaylane Barboza Ramalho Dias','kaylanediasbr@gmail.com','','79998984103','$2b$10$3/IqD0YyRouuDoi8cyvXTeb.towHYlfeec05ZaDcfkLu00EWfVvNS','comum','2025-12-14 18:22:11'),(3,'Teste','teste@mai.com','08838346500','sdadas','$2b$10$lxoblX/JcYk0tfBs3cEMROzMsRm0XzuhQTlUJ8TKQ4jNKOjS2ghR2','comum','2025-12-15 13:16:19');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'sistema_locacao'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-15 19:35:09
